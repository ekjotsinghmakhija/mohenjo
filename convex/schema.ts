import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    externalId: v.string(), // The Clerk User ID
    avatarUrl: v.optional(v.string()),
    xp: v.number(),
    level: v.number(),
  }).index("by_externalId", ["externalId"]),
});
