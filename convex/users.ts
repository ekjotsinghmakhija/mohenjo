import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
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

    // The Hard Gatekeeper Logic
    const userCount = (await ctx.db.query("users").collect()).length;
    if (userCount >= 1000) {
      throw new Error("Project Mohenjo has reached its initial 1,000 founder limit.");
    }

    return await ctx.db.insert("users", {
      ...args,
      xp: 0,
      level: 1,
    });
  },
});

export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});
