import { describe, it, expect } from "bun:test";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

describe("Users Backend", () => {
  it("allows up to 1000 users to sync", async () => {
    const t = convexTest(schema);

    // Mock syncing the first user
    const userId = await t.mutation(api.users.syncUser, {
      name: "Founder One",
      email: "founder1@mohenjo.com",
      externalId: "user_1",
      avatarUrl: "https://github.com/founder1.png",
    });

    expect(userId).toBeDefined();

    // Verify count is 1
    const count = await t.query(api.users.getFounderCount);
    expect(count).toBe(1);
  });

  it("strictly rejects the 1001st user", async () => {
    const t = convexTest(schema);

    // 1. Manually 'seed' 1000 users into the mock database
    await t.run(async (ctx) => {
      for (let i = 0; i < 1000; i++) {
        await ctx.db.insert("users", {
          name: `User ${i}`,
          email: `user${i}@test.com`,
          externalId: `ext_${i}`,
          level: 1,
          isFounder: true,
        });
      }
    });

    // 2. Attempt to sync the 1,001st user via the mutation
    // We expect this to throw the Error we defined in users.ts
    const trySync = () => t.mutation(api.users.syncUser, {
      name: "The 1001st Developer",
      email: "failed@mohenjo.com",
      externalId: "user_1001",
    });

    expect(trySync()).rejects.toThrow(/1,000 founder limit/);
  });
});
