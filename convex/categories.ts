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

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    
    const categories = await ctx.db.query("categories").collect();
    
    // Get supply count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const supplies = await ctx.db
          .query("supplies")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();
        
        return {
          ...category,
          supplyCount: supplies.length,
        };
      })
    );

    return categoriesWithCounts.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole || !['admin', 'manager'].includes(userRole.role)) {
      throw new Error("Insufficient permissions to create categories");
    }

    const categoryId = await ctx.db.insert("categories", args);

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_CATEGORY",
      entityType: "category",
      entityId: categoryId,
      newValues: JSON.stringify(args),
    });

    return categoryId;
  },
});
