import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const userRole = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  return { user, userRole };
}

// Add inventory batch (receiving stock)
export const addInventoryBatch = mutation({
  args: {
    supplyId: v.id("supplies"),
    batchNumber: v.string(),
    quantity: v.number(),
    expirationDate: v.optional(v.number()),
    cost: v.number(),
    location: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole || (!userRole.permissions.includes("stock_movements") && !['admin', 'manager'].includes(userRole.role))) {
      throw new Error("Insufficient permissions to add inventory");
    }

    const supply = await ctx.db.get(args.supplyId);
    if (!supply) {
      throw new Error("Supply not found");
    }

    // Create the batch
    const batchId = await ctx.db.insert("inventoryBatches", {
      supplyId: args.supplyId,
      batchNumber: args.batchNumber,
      quantity: args.quantity,
      expirationDate: args.expirationDate,
      receivedDate: Date.now(),
      cost: args.cost,
      location: args.location,
      isQuarantined: false,
      notes: args.notes,
    });

    // Record the stock movement
    await ctx.db.insert("stockMovements", {
      supplyId: args.supplyId,
      batchId,
      movementType: "in",
      quantity: args.quantity,
      previousQuantity: 0, // Will be calculated properly in a real system
      newQuantity: args.quantity,
      reason: "Inventory received",
      performedBy: user._id,
      location: args.location,
      notes: args.notes,
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "ADD_INVENTORY_BATCH",
      entityType: "batch",
      entityId: batchId,
      newValues: JSON.stringify(args),
    });

    return batchId;
  },
});

// Barcode scanning simulation
export const scanBarcode = mutation({
  args: {
    barcode: v.string(),
    action: v.union(v.literal("lookup"), v.literal("receive"), v.literal("dispense")),
    quantity: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole) {
      throw new Error("User role not found");
    }

    // Find supply by barcode
    const supply = await ctx.db
      .query("supplies")
      .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
      .first();

    if (!supply) {
      throw new Error("Supply not found for this barcode");
    }

    // For lookup, just return supply info
    if (args.action === "lookup") {
      const batches = await ctx.db
        .query("inventoryBatches")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .collect();

      const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);

      return {
        supply,
        currentStock,
        batches: batches.slice(0, 5), // Return first 5 batches
      };
    }

    // For receive/dispense actions, check permissions
    if (!userRole.permissions.includes("stock_movements") && !['admin', 'manager'].includes(userRole.role)) {
      throw new Error("Insufficient permissions for stock movements");
    }

    if (!args.quantity || !args.location) {
      throw new Error("Quantity and location are required for stock movements");
    }

    // Record the movement
    const batches = await ctx.db
      .query("inventoryBatches")
      .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
      .collect();

    const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);
    const newQuantity = args.action === "receive" 
      ? currentStock + args.quantity 
      : currentStock - args.quantity;

    if (newQuantity < 0) {
      throw new Error("Insufficient stock for this operation");
    }

    await ctx.db.insert("stockMovements", {
      supplyId: supply._id,
      movementType: args.action === "receive" ? "in" : "out",
      quantity: args.quantity,
      previousQuantity: currentStock,
      newQuantity,
      reason: `Barcode scan - ${args.action}`,
      performedBy: user._id,
      location: args.location,
    });

    // Update batch quantities (simplified - in reality would use FIFO/FEFO)
    if (args.action === "dispense" && batches.length > 0) {
      let remainingToDispense = args.quantity;
      for (const batch of batches.sort((a, b) => (a.expirationDate || Infinity) - (b.expirationDate || Infinity))) {
        if (remainingToDispense <= 0) break;
        
        const dispenseFromBatch = Math.min(batch.quantity, remainingToDispense);
        await ctx.db.patch(batch._id, {
          quantity: batch.quantity - dispenseFromBatch
        });
        remainingToDispense -= dispenseFromBatch;
      }
    }

    return {
      success: true,
      supply,
      previousStock: currentStock,
      newStock: newQuantity,
      action: args.action,
    };
  },
});

// Get inventory analytics
export const getInventoryAnalytics = query({
  args: {
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("quarter"))),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const period = args.period || "month";
    const now = Date.now();
    const periodMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
    };

    const startTime = now - periodMs[period];

    // Get stock movements in period
    const movements = await ctx.db
      .query("stockMovements")
      .filter((q) => q.gte(q.field("_creationTime"), startTime))
      .collect();

    // Calculate metrics
    const totalMovements = movements.length;
    const inboundMovements = movements.filter(m => m.movementType === "in");
    const outboundMovements = movements.filter(m => m.movementType === "out");
    
    const totalReceived = inboundMovements.reduce((sum, m) => sum + m.quantity, 0);
    const totalDispensed = outboundMovements.reduce((sum, m) => sum + m.quantity, 0);

    // Get current inventory value
    const supplies = await ctx.db.query("supplies").filter(q => q.eq(q.field("isActive"), true)).collect();
    let totalInventoryValue = 0;
    let lowStockItems = 0;
    let criticalStockItems = 0;

    for (const supply of supplies) {
      const batches = await ctx.db
        .query("inventoryBatches")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .collect();

      const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);
      const stockValue = batches.reduce((total, batch) => total + (batch.quantity * batch.cost), 0);
      
      totalInventoryValue += stockValue;

      if (currentStock <= supply.reorderPoint) {
        criticalStockItems++;
      } else if (currentStock <= supply.minimumStock) {
        lowStockItems++;
      }
    }

    // Anomaly detection (simplified)
    const averageDailyUsage = totalDispensed / (periodMs[period] / (24 * 60 * 60 * 1000));
    const anomalies = [];

    // Check for unusual usage patterns
    const dailyUsage = new Map<string, number>();
    outboundMovements.forEach(movement => {
      const date = new Date(movement._creationTime).toISOString().split('T')[0];
      dailyUsage.set(date, (dailyUsage.get(date) || 0) + movement.quantity);
    });

    for (const [date, usage] of dailyUsage.entries()) {
      if (usage > averageDailyUsage * 2) { // Usage is 2x higher than average
        anomalies.push({
          type: "high_usage",
          date,
          value: usage,
          threshold: averageDailyUsage * 2,
          message: `Unusually high usage detected on ${date}: ${usage} units (${((usage / averageDailyUsage - 1) * 100).toFixed(0)}% above average)`
        });
      }
    }

    return {
      period,
      totalMovements,
      totalReceived,
      totalDispensed,
      totalInventoryValue,
      lowStockItems,
      criticalStockItems,
      averageDailyUsage: Math.round(averageDailyUsage),
      anomalies,
      turnoverRate: totalInventoryValue > 0 ? (totalDispensed / totalInventoryValue * 365 / (periodMs[period] / (24 * 60 * 60 * 1000))).toFixed(2) : "0",
    };
  },
});

// Generate predictive reorder suggestions
export const getPredictiveReorderSuggestions = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);

    const supplies = await ctx.db.query("supplies").filter(q => q.eq(q.field("isActive"), true)).collect();
    const suggestions = [];

    for (const supply of supplies) {
      // Get current stock
      const batches = await ctx.db
        .query("inventoryBatches")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .collect();

      const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);

      // Get usage data for the last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentMovements = await ctx.db
        .query("stockMovements")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .filter(q => q.and(
          q.gte(q.field("_creationTime"), thirtyDaysAgo),
          q.eq(q.field("movementType"), "out")
        ))
        .collect();

      const totalUsage = recentMovements.reduce((sum, m) => sum + m.quantity, 0);
      const averageDailyUsage = totalUsage / 30;

      // Calculate days until stockout
      const daysUntilStockout = averageDailyUsage > 0 ? Math.floor(currentStock / averageDailyUsage) : null;

      // Get supplier info
      const supplier = await ctx.db.get(supply.supplierId);

      // Generate suggestion if stock is getting low
      if (daysUntilStockout !== null && daysUntilStockout <= (supplier?.averageDeliveryTime || 7) + 5) {
        const suggestedQuantity = Math.max(
          supply.reorderQuantity,
          Math.ceil(averageDailyUsage * ((supplier?.averageDeliveryTime || 7) + 14)) // 2 weeks buffer
        );

        suggestions.push({
          supply,
          supplier,
          currentStock,
          averageDailyUsage: Math.round(averageDailyUsage * 10) / 10,
          daysUntilStockout,
          suggestedQuantity,
          estimatedCost: suggestedQuantity * supply.unitCost,
          urgency: daysUntilStockout <= 3 ? "critical" : daysUntilStockout <= 7 ? "high" : "medium",
          reason: `Based on ${totalUsage} units used in last 30 days (${averageDailyUsage.toFixed(1)}/day average)`,
        });
      }
    }

    return suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 3, high: 2, medium: 1 };
      return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder];
    });
  },
});
