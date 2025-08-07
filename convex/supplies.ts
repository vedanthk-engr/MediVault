import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user with role check
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

// List all supplies with current stock levels
export const listSupplies = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    searchTerm: v.optional(v.string()),
    lowStockOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    let suppliesQuery;

    if (args.searchTerm) {
      suppliesQuery = ctx.db
        .query("supplies")
        .withSearchIndex("search_supplies", (q) =>
          q.search("name", args.searchTerm!)
            .eq("isActive", true)
        );
    } else {
      suppliesQuery = ctx.db.query("supplies").filter((q) => q.eq(q.field("isActive"), true));
    }

    const supplies = await suppliesQuery.collect();

    // Calculate current stock for each supply
    const suppliesWithStock = await Promise.all(
      supplies.map(async (supply) => {
        const batches = await ctx.db
          .query("inventoryBatches")
          .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
          .collect();

        const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);
        
        // Get category and supplier info
        const category = await ctx.db.get(supply.categoryId);
        const supplier = await ctx.db.get(supply.supplierId);

        // Check for expiring items (within 30 days)
        const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
        const expiringBatches = batches.filter(
          batch => batch.expirationDate && batch.expirationDate <= thirtyDaysFromNow
        );

        const stockStatus = currentStock <= supply.reorderPoint ? 'critical' :
                           currentStock <= supply.minimumStock ? 'low' : 'normal';

        return {
          ...supply,
          currentStock,
          stockStatus,
          category: category?.name || 'Unknown',
          supplier: supplier?.name || 'Unknown',
          expiringQuantity: expiringBatches.reduce((total, batch) => total + batch.quantity, 0),
          nextExpirationDate: expiringBatches.length > 0 
            ? Math.min(...expiringBatches.map(b => b.expirationDate!))
            : null,
        };
      })
    );

    // Filter by category if specified
    let filteredSupplies = suppliesWithStock;
    if (args.categoryId) {
      filteredSupplies = suppliesWithStock.filter(s => s.categoryId === args.categoryId);
    }

    // Filter by low stock if specified
    if (args.lowStockOnly) {
      filteredSupplies = filteredSupplies.filter(s => s.stockStatus !== 'normal');
    }

    return filteredSupplies.sort((a, b) => {
      // Sort by stock status priority, then by name
      const statusPriority = { critical: 3, low: 2, normal: 1 };
      const aPriority = statusPriority[a.stockStatus as keyof typeof statusPriority];
      const bPriority = statusPriority[b.stockStatus as keyof typeof statusPriority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

// Get supply details with full inventory information
export const getSupplyDetails = query({
  args: { supplyId: v.id("supplies") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const supply = await ctx.db.get(args.supplyId);
    if (!supply) {
      throw new Error("Supply not found");
    }

    // Get all batches for this supply
    const batches = await ctx.db
      .query("inventoryBatches")
      .withIndex("by_supply", (q) => q.eq("supplyId", args.supplyId))
      .collect();

    // Get recent stock movements
    const movements = await ctx.db
      .query("stockMovements")
      .withIndex("by_supply", (q) => q.eq("supplyId", args.supplyId))
      .order("desc")
      .take(20);

    // Get category and supplier
    const category = await ctx.db.get(supply.categoryId);
    const supplier = await ctx.db.get(supply.supplierId);

    // Calculate analytics
    const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);
    const totalValue = batches.reduce((total, batch) => total + (batch.quantity * batch.cost), 0);

    // Get usage analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString().split('T')[0];

    const usageData = await ctx.db
      .query("usageAnalytics")
      .withIndex("by_supply_date", (q) => 
        q.eq("supplyId", args.supplyId).gte("date", dateString)
      )
      .collect();

    const averageDailyUsage = usageData.length > 0 
      ? usageData.reduce((sum, day) => sum + day.quantityUsed, 0) / usageData.length
      : 0;

    const daysUntilStockout = averageDailyUsage > 0 ? Math.floor(currentStock / averageDailyUsage) : null;

    return {
      supply,
      category,
      supplier,
      batches: batches.sort((a, b) => (a.expirationDate || Infinity) - (b.expirationDate || Infinity)),
      movements,
      analytics: {
        currentStock,
        totalValue,
        averageDailyUsage,
        daysUntilStockout,
        stockStatus: currentStock <= supply.reorderPoint ? 'critical' :
                    currentStock <= supply.minimumStock ? 'low' : 'normal',
      },
    };
  },
});

// Create a new supply
export const createSupply = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    supplierId: v.id("suppliers"),
    sku: v.string(),
    barcode: v.optional(v.string()),
    unitOfMeasure: v.string(),
    unitCost: v.number(),
    minimumStock: v.number(),
    maximumStock: v.number(),
    reorderPoint: v.number(),
    reorderQuantity: v.number(),
    isControlledSubstance: v.boolean(),
    requiresRefrigeration: v.boolean(),
    shelfLifeDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole || !['admin', 'manager', 'pharmacist'].includes(userRole.role)) {
      throw new Error("Insufficient permissions to create supplies");
    }

    // Check if SKU already exists
    const existingSupply = await ctx.db
      .query("supplies")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();

    if (existingSupply) {
      throw new Error("A supply with this SKU already exists");
    }

    const supplyId = await ctx.db.insert("supplies", {
      ...args,
      isActive: true,
    });

    // Log the creation
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_SUPPLY",
      entityType: "supply",
      entityId: supplyId,
      newValues: JSON.stringify(args),
    });

    return supplyId;
  },
});

// Update supply information
export const updateSupply = mutation({
  args: {
    supplyId: v.id("supplies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    supplierId: v.optional(v.id("suppliers")),
    unitCost: v.optional(v.number()),
    minimumStock: v.optional(v.number()),
    maximumStock: v.optional(v.number()),
    reorderPoint: v.optional(v.number()),
    reorderQuantity: v.optional(v.number()),
    isControlledSubstance: v.optional(v.boolean()),
    requiresRefrigeration: v.optional(v.boolean()),
    shelfLifeDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole || !['admin', 'manager', 'pharmacist'].includes(userRole.role)) {
      throw new Error("Insufficient permissions to update supplies");
    }

    const { supplyId, ...updates } = args;
    const existingSupply = await ctx.db.get(supplyId);
    
    if (!existingSupply) {
      throw new Error("Supply not found");
    }

    await ctx.db.patch(supplyId, updates);

    // Log the update
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "UPDATE_SUPPLY",
      entityType: "supply",
      entityId: supplyId,
      oldValues: JSON.stringify(existingSupply),
      newValues: JSON.stringify(updates),
    });

    return supplyId;
  },
});

// Record stock movement (in/out/adjustment)
export const recordStockMovement = mutation({
  args: {
    supplyId: v.id("supplies"),
    batchId: v.optional(v.id("inventoryBatches")),
    movementType: v.union(
      v.literal("in"),
      v.literal("out"),
      v.literal("adjustment"),
      v.literal("expired"),
      v.literal("damaged"),
      v.literal("transfer")
    ),
    quantity: v.number(),
    reason: v.string(),
    location: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole) {
      throw new Error("User role not found");
    }

    const supply = await ctx.db.get(args.supplyId);
    if (!supply) {
      throw new Error("Supply not found");
    }

    // Calculate current stock
    const batches = await ctx.db
      .query("inventoryBatches")
      .withIndex("by_supply", (q) => q.eq("supplyId", args.supplyId))
      .collect();

    const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);
    const newQuantity = currentStock + (args.movementType === 'out' ? -args.quantity : args.quantity);

    if (newQuantity < 0) {
      throw new Error("Insufficient stock for this operation");
    }

    // Record the movement
    await ctx.db.insert("stockMovements", {
      supplyId: args.supplyId,
      batchId: args.batchId,
      movementType: args.movementType,
      quantity: args.quantity,
      previousQuantity: currentStock,
      newQuantity,
      reason: args.reason,
      performedBy: user._id,
      location: args.location,
      notes: args.notes,
    });

    // Update batch quantity if specific batch is specified
    if (args.batchId) {
      const batch = await ctx.db.get(args.batchId);
      if (batch) {
        const newBatchQuantity = batch.quantity + (args.movementType === 'out' ? -args.quantity : args.quantity);
        await ctx.db.patch(args.batchId, { quantity: Math.max(0, newBatchQuantity) });
      }
    }

    // Log the movement
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "STOCK_MOVEMENT",
      entityType: "supply",
      entityId: args.supplyId,
      newValues: JSON.stringify(args),
    });

    // Check if reorder is needed
    if (newQuantity <= supply.reorderPoint) {
      await ctx.db.insert("alerts", {
        type: "reorder_needed",
        supplyId: args.supplyId,
        title: "Reorder Required",
        message: `${supply.name} has reached reorder point. Current stock: ${newQuantity}`,
        severity: "high",
        isRead: false,
        isResolved: false,
      });
    }

    return { newQuantity, previousQuantity: currentStock };
  },
});
