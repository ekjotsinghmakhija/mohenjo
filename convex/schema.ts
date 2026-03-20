import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        externalId: v.string(), // Clerk Subject ID (sub)
        avatarUrl: v.optional(v.string()),
        xp: v.number(),
        level: v.number(),
        isFounder: v.boolean(),
    }).index("by_externalId", ["externalId"]),

    // Track physical grid layout
    buildings: defineTable({
        userId: v.id("users"),
        type: v.string(), // e.g., "house", "granary"
        x: v.number(),
        y: v.number(),
        level: v.number(),
    })
    .index("by_user", ["userId"])
    .index("by_position", ["x", "y"]), // Add this line for fast coordinate lookups

    // Batched IDE activity logs
    activity: defineTable({
        userId: v.id("users"),
        type: v.string(), // "commit", "keystroke_batch"
        amount: v.number(),
        timestamp: v.number(),
    }).index("by_user_time", ["userId", "timestamp"]),
});
