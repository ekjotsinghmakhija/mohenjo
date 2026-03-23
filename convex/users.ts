import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getFounderCount = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
  },
});

export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    avatarUrl: v.optional(v.string()),
    faction: v.optional(
      v.union(v.literal("vanguard"), v.literal("syndicate"), v.literal("celestial"))
    ),
  },
  handler: async (ctx, args) => {
    // 1. Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existingUser) {
      if (args.faction && !existingUser.faction) {
        await ctx.db.patch(existingUser._id, { faction: args.faction });
      }
      return existingUser._id;
    }

    // 2. Check the Gatekeeper (1,000 limit) for new users
    // FIX: We query the DB directly here instead of calling the query function
    const allUsers = await ctx.db.query("users").collect();
    const currentCount = allUsers.length;

    if (currentCount >= 1000) {
      throw new Error("CAPACITY_REACHED: The Mohenjo Founder list is currently full.");
    }

    // 3. Insert New Founder
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      externalId: args.externalId,
      avatarUrl: args.avatarUrl,
      faction: args.faction,
    });
  },
});
