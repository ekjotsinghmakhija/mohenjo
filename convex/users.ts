import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Syncs the Clerk user with our Convex database.
 * Enforces the 1,000 user limit.
 */
export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existingUser) return existingUser._id;

    // Hard limit check
    const allUsers = await ctx.db.query("users").collect();
    if (allUsers.length >= 1000) {
      throw new Error("CAPACITY_REACHED: Mohenjo is currently full (1,000/1,000 founders).");
    }

    return await ctx.db.insert("users", {
      ...args,
      xp: 0,
      level: 1,
      isFounder: true,
    });
  },
});

export const getFounderCount = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});
