import { v } from "convex/values";
import type { FunctionReference } from "convex/server";
import { action, internalMutation } from "../_generated/server";
import { api, internal } from "../_generated/api";
import type { CocBattleLog, SyncResult } from "../lib/types";
import { normalizePlayerTag } from "../lib/constants";
import { NOT_LINKED, requireClerkId } from "../lib/auth";

interface SyncCtx {
  runAction: (
    fn: FunctionReference<"action", "public" | "internal">,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  runMutation: (
    fn: FunctionReference<"mutation", "public" | "internal">,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
}

async function runBattleLogPipeline(
  ctx: SyncCtx,
  playerTag: string,
): Promise<SyncResult> {
  try {
    const raw = await ctx.runAction(internal.coc.battlelog.fetchBattleLog, {
      playerTag,
    });
    const log = raw as CocBattleLog;

    await ctx.runMutation(internal.battles.sync.upsertBattleLog, {
      playerTag,
      items: log.items,
    });

    return { ok: true, fetchedAt: Date.now(), name: playerTag };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown sync error";
    return { ok: false, error };
  }
}

export const syncBattleLog = action({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    await requireClerkId(ctx);
    const linked: boolean = await ctx.runQuery(api.accounts.isLinked, {
      playerTag: args.playerTag,
    });
    if (!linked) return { ok: false, error: NOT_LINKED };
    return runBattleLogPipeline(ctx, args.playerTag);
  },
});

export const upsertBattleLog = internalMutation({
  args: {
    playerTag: v.string(),
    items: v.array(
      v.object({
        battleType: v.string(),
        attack: v.boolean(),
        armyShareCode: v.optional(v.string()),
        opponentPlayerTag: v.string(),
        opponentName: v.string(),
        opponentTownHallLevel: v.optional(v.number()),
        stars: v.number(),
        destructionPercentage: v.number(),
        lootedResources: v.optional(
          v.array(v.object({ name: v.string(), amount: v.number() })),
        ),
        extraLootedResources: v.optional(
          v.array(v.object({ name: v.string(), amount: v.number() })),
        ),
        availableLoot: v.optional(
          v.array(v.object({ name: v.string(), amount: v.number() })),
        ),
        battleTime: v.optional(v.number()),
        battleTimestamp: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const playerTag = normalizePlayerTag(args.playerTag);
    const existing = await ctx.db
      .query("battleLogs")
      .withIndex("by_playerTag_fetchedAt", (q) => q.eq("playerTag", playerTag))
      .first();
    const row = {
      playerTag,
      fetchedAt: Date.now(),
      items: args.items,
    };
    if (existing) {
      await ctx.db.patch(existing._id, row);
    } else {
      await ctx.db.insert("battleLogs", row);
    }
  },
});
