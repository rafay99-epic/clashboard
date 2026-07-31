import { v } from "convex/values";
import {
  internalAction,
  internalQuery,
  internalMutation,
} from "../_generated/server";
import { internal } from "../_generated/api";

export const syncAllPlayers = internalAction({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.runQuery(
      internal.sync.cron.listPlayersForSync,
      {},
    );
    await Promise.all(
      players.map((player) =>
        ctx.runMutation(internal.sync.cron.enqueueSync, {
          playerTag: player.playerTag,
        }),
      ),
    );
  },
});

export const listPlayersForSync = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("players").collect();
    return rows.map((r) => ({ playerTag: r.playerTag }));
  },
});

export const enqueueSync = internalMutation({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.sync.workflows.syncWorkflow, args);
  },
});
