import { v } from "convex/values";
import { query } from "../_generated/server";
import { normalizePlayerTag } from "../lib/constants";

export const getPlayer = query({
  args: { playerTag: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_playerTag", (q) =>
        q.eq("playerTag", normalizePlayerTag(args.playerTag)),
      )
      .first();
    return player ?? null;
  },
});

export const getSnapshots = query({
  args: { playerTag: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_playerTag_fetchedAt", (q) =>
        q.eq("playerTag", normalizePlayerTag(args.playerTag)),
      )
      .order("desc")
      .take(args.limit ?? 20);
    return snapshots;
  },
});
