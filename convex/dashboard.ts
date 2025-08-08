import { query } from "./_generated/server";
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

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);

    // Get all supplies with current stock
    const supplies = await ctx.db.query("supplies").filter(q => q.eq(q.field("isActive"), true)).collect();
    
    let totalSupplies = supplies.length;
    let lowStockCount = 0;
    let criticalStockCount = 0;
    let totalValue = 0;
    let expiringItemsCount = 0;

    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);

    for (const supply of supplies) {
      const batches = await ctx.db
        .query("inventoryBatches")
        .withIndex("by_supply", (q) => q.eq("supplyId", supply._id))
        .collect();

      const currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);
      const stockValue = batches.reduce((total, batch) => total + (batch.quantity * batch.cost), 0);
      
      totalValue += stockValue;

      if (currentStock <= supply.reorderPoint) {
        criticalStockCount++;
      } else if (currentStock <= supply.minimumStock) {
        lowStockCount++;
      }

      // Check for expiring items
      const expiringBatches = batches.filter(
        batch => batch.expirationDate && batch.expirationDate <= thirtyDaysFromNow
      );
      if (expiringBatches.length > 0) {
        expiringItemsCount++;
      }
    }

    // Get recent alerts
    const recentAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_status", (q) => q.eq("isRead", false).eq("isResolved", false))
      .order("desc")
      .take(10);

    // Get recent stock movements
    const recentMovements = await ctx.db
      .query("stockMovements")
      .order("desc")
      .take(10);

    // Get pending purchase orders
    const pendingOrders = await ctx.db
      .query("purchaseOrders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      overview: {
        totalSupplies,
        lowStockCount,
        criticalStockCount,
        totalValue,
        expiringItemsCount,
        pendingOrdersCount: pendingOrders.length,
      },
      recentAlerts: await Promise.all(
        recentAlerts.map(async (alert) => {
          const supply = await ctx.db.get(alert.supplyId);
          return {
            ...alert,
            supplyName: supply?.name || 'Unknown',
          };
        })
      ),
      recentMovements: await Promise.all(
        recentMovements.map(async (movement) => {
          const supply = await ctx.db.get(movement.supplyId);
          const userName = movement.performedBy === "system" 
            ? "System" 
            : (await ctx.db.get(movement.performedBy))?.name || 
              (await ctx.db.get(movement.performedBy))?.email || 
              'Unknown';
          return {
            ...movement,
            supplyName: supply?.name || 'Unknown',
            userName,
          };
        })
      ),
    };
  },
});

export const getUsageTrends = query({
  args: {
    supplyId: v.optional(v.id("supplies")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const days = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateString = startDate.toISOString().split('T')[0];

    let usageQuery = ctx.db
      .query("usageAnalytics")
      .withIndex("by_date", (q) => q.gte("date", dateString));

    if (args.supplyId) {
      usageQuery = ctx.db
        .query("usageAnalytics")
        .withIndex("by_supply_date", (q) => 
          q.eq("supplyId", args.supplyId!).gte("date", dateString)
        );
    }

    const usageData = await usageQuery.collect();

    // Group by date and sum quantities
    const dailyUsage = usageData.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = 0;
      }
      acc[record.date] += record.quantityUsed;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array format for charting
    const trendData = Object.entries(dailyUsage)
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return trendData;
  },
});

export const getExpiringItems = query({
  args: {
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const daysAhead = args.daysAhead || 30;
    const futureDate = Date.now() + (daysAhead * 24 * 60 * 60 * 1000);

    const expiringBatches = await ctx.db
      .query("inventoryBatches")
      .withIndex("by_expiration", (q) => q.lte("expirationDate", futureDate))
      .collect();

    const expiringItems = await Promise.all(
      expiringBatches
        .filter(batch => batch.quantity > 0 && batch.expirationDate)
        .map(async (batch) => {
          const supply = await ctx.db.get(batch.supplyId);
          const category = supply?.categoryId ? await ctx.db.get(supply.categoryId) : null;
          
          const daysUntilExpiration = batch.expirationDate 
            ? Math.ceil((batch.expirationDate - Date.now()) / (24 * 60 * 60 * 1000))
            : null;

          return {
            ...batch,
            supply: supply?.name || 'Unknown',
            category: category?.name || 'Unknown',
            daysUntilExpiration,
            isExpired: daysUntilExpiration !== null && daysUntilExpiration < 0,
            value: batch.quantity * batch.cost,
          };
        })
    );

    return expiringItems.sort((a, b) => {
      if (a.expirationDate && b.expirationDate) {
        return a.expirationDate - b.expirationDate;
      }
      return 0;
    });
  },
});
