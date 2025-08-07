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

  return { user, userId };
}

export const initializeUserRole = mutation({
  args: {
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("pharmacist"),
      v.literal("nurse"),
      v.literal("technician"),
      v.literal("viewer")
    ),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await getCurrentUser(ctx);
    
    // Check if user already has a role
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingRole) {
      return existingRole._id;
    }

    // Define permissions based on role
    const rolePermissions = {
      admin: [
        "create_supplies", "update_supplies", "delete_supplies",
        "create_categories", "update_categories", "delete_categories",
        "create_suppliers", "update_suppliers", "delete_suppliers",
        "manage_users", "view_analytics", "manage_orders",
        "view_audit_logs", "system_settings"
      ],
      manager: [
        "create_supplies", "update_supplies",
        "create_categories", "update_categories",
        "create_suppliers", "update_suppliers",
        "view_analytics", "manage_orders", "view_audit_logs"
      ],
      pharmacist: [
        "create_supplies", "update_supplies",
        "stock_movements", "view_analytics", "manage_orders"
      ],
      nurse: [
        "stock_movements", "view_supplies", "create_alerts"
      ],
      technician: [
        "stock_movements", "view_supplies", "update_inventory"
      ],
      viewer: [
        "view_supplies", "view_analytics"
      ]
    };

    const roleId = await ctx.db.insert("userRoles", {
      userId,
      role: args.role,
      permissions: rolePermissions[args.role],
      department: args.department,
      isActive: true,
    });

    return roleId;
  },
});

export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getCurrentUser(ctx);
    
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return userRole;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("pharmacist"),
      v.literal("nurse"),
      v.literal("technician"),
      v.literal("viewer")
    ),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUser(ctx);
    
    // Check if current user has admin permissions
    const currentUserRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!currentUserRole || currentUserRole.role !== "admin") {
      throw new Error("Insufficient permissions to update user roles");
    }

    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingRole) {
      throw new Error("User role not found");
    }

    const rolePermissions = {
      admin: [
        "create_supplies", "update_supplies", "delete_supplies",
        "create_categories", "update_categories", "delete_categories",
        "create_suppliers", "update_suppliers", "delete_suppliers",
        "manage_users", "view_analytics", "manage_orders",
        "view_audit_logs", "system_settings"
      ],
      manager: [
        "create_supplies", "update_supplies",
        "create_categories", "update_categories",
        "create_suppliers", "update_suppliers",
        "view_analytics", "manage_orders", "view_audit_logs"
      ],
      pharmacist: [
        "create_supplies", "update_supplies",
        "stock_movements", "view_analytics", "manage_orders"
      ],
      nurse: [
        "stock_movements", "view_supplies", "create_alerts"
      ],
      technician: [
        "stock_movements", "view_supplies", "update_inventory"
      ],
      viewer: [
        "view_supplies", "view_analytics"
      ]
    };

    await ctx.db.patch(existingRole._id, {
      role: args.role,
      permissions: rolePermissions[args.role],
      department: args.department,
    });

    return existingRole._id;
  },
});
