import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    avatarUrl: v.optional(v.string()),
    // Add the Faction Union Type
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
