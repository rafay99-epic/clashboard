import { v } from "convex/values";
import { query } from "../_generated/server";
import { normalizePlayerTag } from "../lib/constants";

export const getBattleLog = query({
  args: { playerTag: v.string() },
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query("battleLogs")
      .withIndex("by_playerTag_fetchedAt", (q) =>
        q.eq("playerTag", normalizePlayerTag(args.playerTag)),
      )
      .first();
    return log ?? null;
  },
});
