import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    avatarUrl: v.optional(v.string()),

    // The Faction/Civilization
    faction: v.optional(
      v.union(
        // V2 Civilizations
        v.literal("architect_empire"),
        v.literal("artisan_republic"),
        v.literal("void_syndicate"),

        // V1 Legacy Factions (Kept so existing DB records pass validation)
        v.literal("vanguard"),
        v.literal("syndicate"),
        v.literal("celestial")
      )
    ),

    // The 4-Tier Economy System
    resources: v.optional(
      v.object({
        bronze: v.number(),
        silver: v.number(),
        gold: v.number(),
        diamond: v.number(),
      })
    ),

    lastGithubSync: v.optional(v.number()),

    // Legacy fields
    xp: v.optional(v.number()),
    level: v.optional(v.number()),
    isFounder: v.optional(v.boolean()),
  }).index("by_externalId", ["externalId"]),

  buildings: defineTable({
    userId: v.id("users"),
    type: v.string(),
    level: v.number(),

    q: v.optional(v.number()),
    r: v.optional(v.number()),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_position", ["q", "r"]),

  territory: defineTable({
    faction: v.string(),
    q: v.number(),
    r: v.number(),
  }).index("by_position", ["q", "r"]),

  activity: defineTable({
    userId: v.id("users"),
    type: v.string(),
    details: v.string(),
    timestamp: v.number(),
  }).index("by_user_time", ["userId", "timestamp"]),
});
