import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  handler: async (ctx) => {
    const buildings = await ctx.db.query("buildings").collect();

    // Enrich buildings with their owner's faction so the frontend knows what style to draw
    const enrichedBuildings = await Promise.all(
      buildings.map(async (b) => {
        const owner = await ctx.db.get(b.userId);
        return {
          ...b,
          faction: owner?.faction || "unassigned",
          ownerName: owner?.name || "Unknown",
        };
      })
    );

    return enrichedBuildings;
  },
});

export const placeBuilding = mutation({
  args: {
    externalId: v.string(),
    x: v.number(),
    y: v.number()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if someone already built on this exact tile
    const existing = await ctx.db
      .query("buildings")
      .withIndex("by_position", (q) => q.eq("x", args.x).eq("y", args.y))
      .unique();

    if (existing) throw new Error("Tile is already occupied by another founder.");

    // Insert the new building
    await ctx.db.insert("buildings", {
      userId: user._id,
      x: args.x,
      y: args.y,
      type: "standard", // Default type
      level: 1,         // Starts at level 1
    });
  }
});
