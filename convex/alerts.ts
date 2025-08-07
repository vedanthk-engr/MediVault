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

export const getAlerts = query({
  args: {
    unreadOnly: v.optional(v.boolean()),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    let alertsQuery;

    if (args.unreadOnly) {
      alertsQuery = ctx.db
        .query("alerts")
        .withIndex("by_status", (q) => q.eq("isRead", false).eq("isResolved", false));
    } else {
      alertsQuery = ctx.db.query("alerts");
    }

    const alerts = await alertsQuery.order("desc").take(50);

    const alertsWithSupplyInfo = await Promise.all(
      alerts.map(async (alert) => {
        const supply = await ctx.db.get(alert.supplyId);
        return {
          ...alert,
          supplyName: supply?.name || 'Unknown',
          supplySku: supply?.sku || 'Unknown',
        };
      })
    );

    let filteredAlerts = alertsWithSupplyInfo;
    if (args.severity) {
      filteredAlerts = alertsWithSupplyInfo.filter(alert => alert.severity === args.severity);
    }

    return filteredAlerts;
  },
});

export const markAlertAsRead = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUser(ctx);

    await ctx.db.patch(args.alertId, {
      isRead: true,
    });

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "MARK_ALERT_READ",
      entityType: "alert",
      entityId: args.alertId,
    });
  },
});

export const resolveAlert = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUser(ctx);

    await ctx.db.patch(args.alertId, {
      isResolved: true,
      resolvedBy: user._id,
      resolvedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "RESOLVE_ALERT",
      entityType: "alert",
      entityId: args.alertId,
    });
  },
});

// Internal function to generate alerts (called by scheduled functions)
export const generateLowStockAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const supplies = await ctx.db.query("supplies").filter(q => q.eq(q.field("isActive"), true)).collect();

    for (const supply of supplies) {
      const batches = await ctx.db
        .query("inventoryBatches")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .collect();

      const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);

      // Check if we already have an unresolved alert for this supply
      const existingAlert = await ctx.db
        .query("alerts")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .filter(q => q.and(
          q.eq(q.field("type"), "low_stock"),
          q.eq(q.field("isResolved"), false)
        ))
        .first();

      if (!existingAlert && currentStock <= supply.reorderPoint) {
        const severity = currentStock === 0 ? "critical" : 
                        currentStock <= supply.reorderPoint * 0.5 ? "high" : "medium";

        await ctx.db.insert("alerts", {
          type: "low_stock",
          supplyId: supply._id,
          title: currentStock === 0 ? "Out of Stock" : "Low Stock Alert",
          message: `${supply.name} is ${currentStock === 0 ? 'out of stock' : `low in stock (${currentStock} remaining)`}. Reorder point: ${supply.reorderPoint}`,
          severity,
          isRead: false,
          isResolved: false,
        });
      }
    }
  },
});

export const generateExpirationAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000);

    const expiringBatches = await ctx.db
      .query("inventoryBatches")
      .withIndex("by_expiration", (q) => q.lte("expirationDate", thirtyDaysFromNow))
      .collect();

    for (const batch of expiringBatches) {
      if (batch.quantity === 0 || !batch.expirationDate) continue;

      const supply = await ctx.db.get(batch.supplyId);
      if (!supply) continue;

      const daysUntilExpiration = Math.ceil((batch.expirationDate - Date.now()) / (24 * 60 * 60 * 1000));
      
      // Check if we already have an alert for this batch
      const existingAlert = await ctx.db
        .query("alerts")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .filter(q => q.and(
          q.or(
            q.eq(q.field("type"), "expiring_soon"),
            q.eq(q.field("type"), "expired")
          ),
          q.eq(q.field("isResolved"), false)
        ))
        .first();

      if (!existingAlert) {
        const isExpired = daysUntilExpiration < 0;
        const severity = isExpired ? "critical" : 
                        daysUntilExpiration <= 7 ? "high" : "medium";

        await ctx.db.insert("alerts", {
          type: isExpired ? "expired" : "expiring_soon",
          supplyId: supply._id,
          title: isExpired ? "Expired Items" : "Items Expiring Soon",
          message: `${supply.name} batch ${batch.batchNumber} ${isExpired ? 'has expired' : `expires in ${daysUntilExpiration} days`}. Quantity: ${batch.quantity}`,
          severity,
          isRead: false,
          isResolved: false,
        });
      }
    }
  },
});
