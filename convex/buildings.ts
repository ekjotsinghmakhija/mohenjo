import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  handler: async (ctx) => {
    const buildings = await ctx.db.query("buildings").collect();

    // FILTER: Only return buildings that have the new Hexagonal coordinates
    const validBuildings = buildings.filter(b => b.q !== undefined && b.r !== undefined);

    return await Promise.all(
      validBuildings.map(async (b) => {
        const owner = await ctx.db.get(b.userId);
        return {
          ...b,
          faction: owner?.faction || "unassigned",
          ownerName: owner?.name || "Unknown",
        };
      })
    );
  },
});

export const placeBuilding = mutation({
  args: {
    externalId: v.string(),
    q: v.number(),
    r: v.number()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("buildings")
      .withIndex("by_position", (q) => q.eq("q", args.q).eq("r", args.r))
      .unique();

    if (existing) throw new Error("Tile is already occupied.");

    // Economy Check (10 Bronze)
    if (!user.resources || user.resources.bronze < 10) {
      throw new Error("Insufficient Bronze. You need 10 Bronze (Commits) to build.");
    }

    // Deduct cost
    await ctx.db.patch(user._id, {
      resources: { ...user.resources, bronze: user.resources.bronze - 10 }
    });

    // Place building
    await ctx.db.insert("buildings", {
      userId: user._id,
      q: args.q,
      r: args.r,
      type: "standard",
      level: 1,
    });
  }
});

// NEW: Upgrade an existing building
export const upgradeBuilding = mutation({
  args: {
    externalId: v.string(),
    buildingId: v.id("buildings"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!user) throw new Error("User not found");

    const building = await ctx.db.get(args.buildingId);
    if (!building) throw new Error("Building not found");
    if (building.userId !== user._id) throw new Error("You can only upgrade your own buildings.");

    // Economy Check (5 Silver)
    if (!user.resources || user.resources.silver < 5) {
      throw new Error("Insufficient Silver. You need 5 Silver (PRs) to upgrade.");
    }

    // Deduct cost and level up!
    await ctx.db.patch(user._id, {
      resources: { ...user.resources, silver: user.resources.silver - 5 }
    });

    await ctx.db.patch(building._id, {
      level: building.level + 1
    });
  }
});
