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

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole || !['admin', 'manager'].includes(userRole.role)) {
      throw new Error("Insufficient permissions to update categories");
    }

    const { categoryId, ...updates } = args;
    const existingCategory = await ctx.db.get(categoryId);
    
    if (!existingCategory) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(categoryId, updates);

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "UPDATE_CATEGORY",
      entityType: "category",
      entityId: categoryId,
      oldValues: JSON.stringify(existingCategory),
      newValues: JSON.stringify(updates),
    });

    return categoryId;
  },
});

export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const { user, userRole } = await getCurrentUser(ctx);
    
    if (!userRole || !['admin', 'manager'].includes(userRole.role)) {
      throw new Error("Insufficient permissions to delete categories");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has any supplies
    const supplies = await ctx.db
      .query("supplies")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    if (supplies.length > 0) {
      throw new Error("Cannot delete category with existing supplies");
    }

    await ctx.db.delete(args.categoryId);

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "DELETE_CATEGORY",
      entityType: "category",
      entityId: args.categoryId,
      oldValues: JSON.stringify(category),
    });

    return args.categoryId;
  },
});
