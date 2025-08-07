import { query, mutation } from "./_generated/server";
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

export const listSuppliers = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    
    const suppliers = await ctx.db.query("suppliers").collect();
    
    // Get supply count and recent orders for each supplier
    const suppliersWithStats = await Promise.all(
      suppliers.map(async (supplier) => {
        const supplies = await ctx.db
          .query("supplies")
          .withIndex("by_supplier", (q) => q.eq("supplierId", supplier._id))
          .collect();

        const recentOrders = await ctx.db
          .query("purchaseOrders")
          .withIndex("by_supplier", (q) => q.eq("supplierId", supplier._id))
          .order("desc")
          .take(5);
        
        return {
          ...supplier,
          supplyCount: supplies.length,
          recentOrdersCount: recentOrders.length,
          lastOrderDate: recentOrders.length > 0 ? recentOrders[0]._creationTime : null,
        };
      })
    );

    return suppliersWithStats
      .filter(s => s.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createSupplier = mutation({
  args: {
    name: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole || !['admin', 'manager'].includes(userRole.role)) {
      throw new Error("Insufficient permissions to create suppliers");
    }

    const supplierId = await ctx.db.insert("suppliers", {
      ...args,
      isActive: true,
      performanceRating: 3, // Default rating
      averageDeliveryTime: 7, // Default 7 days
    });

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_SUPPLIER",
      entityType: "supplier",
      entityId: supplierId,
      newValues: JSON.stringify(args),
    });

    return supplierId;
  },
});
