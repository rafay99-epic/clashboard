import { internalMutation } from "../_generated/server";
import { ROSTER_CATEGORIES, ROSTER_BASES } from "../schema";
import rosterManifest from "../../src/data/roster-manifest.json";

export const seedRoster = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("roster").first();
    if (existing) {
      return { skipped: true, count: 0 };
    }

    const validEntries = rosterManifest.filter((entry) => {
      const category = ROSTER_CATEGORIES.find((c) => c === entry.category);
      const base = ROSTER_BASES.find((b) => b === entry.base);
      return Boolean(category && base);
    });

    await Promise.all(
      validEntries.map(async (entry) => {
        const category = ROSTER_CATEGORIES.find((c) => c === entry.category)!;
        const base = ROSTER_BASES.find((b) => b === entry.base)!;
        await ctx.db.insert("roster", {
          base,
          category,
          name: entry.name,
          aliases: entry.aliases ?? [],
          maxLevel: entry.maxLevel,
          imageUrl: entry.imageUrl,
        });
      }),
    );
    return { skipped: false, count: validEntries.length };
  },
});
