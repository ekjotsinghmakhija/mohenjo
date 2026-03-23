import { describe, it, expect } from "bun:test";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

describe("Users Backend", () => {
  it("allows up to 1000 users to sync", async () => {
    const t = convexTest(schema);

    const userId = await t.mutation(api.users.syncUser, {
      name: "Founder One",
      email: "founder1@mohenjo.com",
      externalId: "user_1",
      avatarUrl: "https://github.com/founder1.png",
    });

    expect(userId).toBeDefined();
    const count = await t.query(api.users.getFounderCount);
    expect(count).toBe(1);
  });

  it("strictly rejects the 1001st user", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      for (let i = 0; i < 1000; i++) {
        await ctx.db.insert("users", {
          name: `User ${i}`,
          email: `user${i}@test.com`,
          externalId: `ext_${i}`,
        });
      }
    });

    const trySync = () => t.mutation(api.users.syncUser, {
      name: "The 1001st Developer",
      email: "failed@mohenjo.com",
      externalId: "user_1001",
    });

    expect(trySync()).rejects.toThrow(/CAPACITY_REACHED/);
  });
});
