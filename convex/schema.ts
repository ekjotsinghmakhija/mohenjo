import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    avatarUrl: v.optional(v.string()),
    // Added these to match your production data and support the roadmap
    xp: v.optional(v.number()),
    level: v.optional(v.number()),
    isFounder: v.optional(v.boolean()),
    // Faction for Multiverse Grid
    faction: v.optional(
      v.union(v.literal("vanguard"), v.literal("syndicate"), v.literal("celestial"))
    ),
  }).index("by_externalId", ["externalId"]),

  buildings: defineTable({
    userId: v.id("users"),
    type: v.string(),
    x: v.number(),
    y: v.number(),
    level: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_position", ["x", "y"]),

  activity: defineTable({
    userId: v.id("users"),
    type: v.string(),
    details: v.string(),
    timestamp: v.number(),
  }).index("by_user_time", ["userId", "timestamp"]),
});
