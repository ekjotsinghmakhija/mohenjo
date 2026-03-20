import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Places a new building on the grid.
 * In the future, this will cost XP/Gold.
 */
export const placeBuilding = mutation({
  args: {
    type: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if space is occupied
    const existing = await ctx.db
      .query("buildings")
      .withIndex("by_position", (q) => q.eq("x", args.x).eq("y", args.y))
      .unique();

    if (existing) throw new Error("This plot of land is already occupied");

    return await ctx.db.insert("buildings", {
      userId: user._id,
      type: args.type,
      x: args.x,
      y: args.y,
      level: 1,
    });
  },
});

/**
 * Gets all buildings in the city for the global view.
 */
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("buildings").collect();
  },
});
