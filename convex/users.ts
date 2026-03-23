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
      v.union(v.literal("architect_empire"), v.literal("artisan_republic"), v.literal("void_syndicate"), v.literal("vanguard"), v.literal("syndicate"), v.literal("celestial"))
    ),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existingUser) {
      // FIX: If this is an old account that doesn't have an economy yet, give them the starter funds!
      if (!existingUser.resources) {
        await ctx.db.patch(existingUser._id, {
          resources: { bronze: 100, silver: 10, gold: 0, diamond: 0 }
        });
      }

      if (args.faction && !existingUser.faction) {
        await ctx.db.patch(existingUser._id, { faction: args.faction });
      }
      return existingUser._id;
    }

    const allUsers = await ctx.db.query("users").collect();
    if (allUsers.length >= 1000) {
      throw new Error("CAPACITY_REACHED: The Mohenjo Founder list is currently full.");
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      externalId: args.externalId,
      avatarUrl: args.avatarUrl,
      faction: args.faction,
      resources: {
        bronze: 100,
        silver: 10,
        gold: 0,
        diamond: 0,
      }
    });
  },
});

export const convertResource = mutation({
  args: {
    externalId: v.string(),
    fromType: v.union(v.literal("bronze"), v.literal("silver"), v.literal("gold")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user || !user.resources) throw new Error("User or resources not found");

    const r = user.resources;

    if (args.fromType === "bronze" && r.bronze >= 10) {
      await ctx.db.patch(user._id, { resources: { ...r, bronze: r.bronze - 10, silver: r.silver + 1 } });
    } else if (args.fromType === "silver" && r.silver >= 10) {
      await ctx.db.patch(user._id, { resources: { ...r, silver: r.silver - 10, gold: r.gold + 1 } });
    } else if (args.fromType === "gold" && r.gold >= 10) {
      await ctx.db.patch(user._id, { resources: { ...r, gold: r.gold - 10, diamond: r.diamond + 1 } });
    } else {
      throw new Error("Insufficient resources for conversion (Requires 10:1)");
    }
  }
});
