import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireClerkId } from "../lib/auth";

export const getRoster = query({
  args: {
    base: v.optional(
      v.union(v.literal("home"), v.literal("builder"), v.literal("capital")),
    ),
    category: v.optional(
      v.union(
        v.literal("troops"),
        v.literal("spells"),
        v.literal("heroes"),
        v.literal("siege"),
        v.literal("buildings"),
        v.literal("traps"),
        v.literal("pets"),
        v.literal("equipment"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireClerkId(ctx);
    let rows = await ctx.db.query("roster").collect();
    if (args.base) rows = rows.filter((r) => r.base === args.base);
    if (args.category) rows = rows.filter((r) => r.category === args.category);
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },
});
