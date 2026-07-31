import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  mutation,
} from "../_generated/server";
import { api, internal } from "../_generated/api";
import type { CocPlayer, SyncCtx, SyncResult } from "../lib/types";
import { normalizePlayerTag } from "../lib/constants";
import { playerValidator } from "../schema";
import { normalizePlayer } from "./normalize";

async function runSyncPipeline(
  ctx: SyncCtx,
  playerTag: string,
): Promise<SyncResult> {
  try {
    const raw = await ctx.runAction(api.coc.fetch.fetchPlayer, { playerTag });
    const player = raw as CocPlayer;

    const normalized = normalizePlayer(player, playerTag);
    await ctx.runMutation(internal.players.sync.upsertPlayer, {
      player: normalized,
      playerTag,
    });
    await ctx.runMutation(internal.players.sync.insertSnapshot, {
      playerTag,
      data: normalized,
    });

    return { ok: true, fetchedAt: Date.now(), name: normalized.name };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown sync error";
    return { ok: false, error };
  }
}

export const syncPlayer = action({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    return runSyncPipeline(ctx, args.playerTag);
  },
});

export const requestRefresh = action({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    return runSyncPipeline(ctx, args.playerTag);
  },
});

export const syncPlayerInternal = internalAction({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    return runSyncPipeline(ctx, args.playerTag);
  },
});

export const upsertPlayer = internalMutation({
  args: {
    player: playerValidator,
    playerTag: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const playerTag = normalizePlayerTag(args.playerTag);
    const existing = await ctx.db
      .query("players")
      .withIndex("by_playerTag", (q) => q.eq("playerTag", playerTag))
      .first();

    const row = {
      ...args.player,
      playerTag,
      lastFetchedAt: now,
      lastSuccessfulAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, row);
    } else {
      await ctx.db.insert("players", row);
    }
  },
});

export const insertSnapshot = internalMutation({
  args: {
    playerTag: v.string(),
    data: playerValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("snapshots", {
      playerTag: normalizePlayerTag(args.playerTag),
      fetchedAt: Date.now(),
      data: args.data,
    });
  },
});

export const recordError = internalMutation({
  args: {
    playerTag: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_playerTag", (q) =>
        q.eq("playerTag", normalizePlayerTag(args.playerTag)),
      )
      .first();
    if (player) {
      await ctx.db.patch(player._id, {
        lastError: args.error,
        lastFetchedAt: Date.now(),
      });
    }
  },
});

export const reportError = mutation({
  args: {
    playerTag: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.players.sync.recordError, args);
  },
});

export const seedTestPlayer = mutation({
  args: {
    playerTag: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tag = normalizePlayerTag(args.playerTag ?? "#TEST");
    const name = args.name ?? "Test Player";
    const now = Date.now();
    const existing = await ctx.db
      .query("players")
      .withIndex("by_playerTag", (q) => q.eq("playerTag", tag))
      .first();
    const row = {
      playerTag: tag,
      name,
      townHallLevel: 14,
      builderHallLevel: 9,
      expLevel: 187,
      trophies: 4200,
      bestTrophies: 4600,
      attackWins: 1500,
      defenseWins: 800,
      clanName: "Test Clan",
      clanTag: "#TST",
      troops: [
        { name: "Barbarian", level: 12, maxLevel: 12 },
        { name: "Archer", level: 10, maxLevel: 14 },
        { name: "Giant", level: 11, maxLevel: 12 },
        { name: "Wall Breaker", level: 12, maxLevel: 14 },
        { name: "Balloon", level: 5, maxLevel: 12 },
        { name: "Wizard", level: 12, maxLevel: 14 },
        { name: "Dragon", level: 12, maxLevel: 13 },
      ],
      spells: [
        { name: "Lightning Spell", level: 12, maxLevel: 13 },
        { name: "Healing Spell", level: 13, maxLevel: 13 },
        { name: "Rage Spell", level: 10, maxLevel: 11 },
        { name: "Freeze Spell", level: 7, maxLevel: 11 },
      ],
      heroes: [
        { name: "Barbarian King", level: 80, maxLevel: 95 },
        { name: "Archer Queen", level: 80, maxLevel: 95 },
        { name: "Grand Warden", level: 55, maxLevel: 65 },
      ],
      heroEquipment: [
        { name: "Giant Gauntlet", level: 20, maxLevel: 27 },
        { name: "Spiky Ball", level: 15, maxLevel: 27 },
      ],
      buildings: [
        { name: "Cannon", level: 21, maxLevel: 21 },
        { name: "Archer Tower", level: 20, maxLevel: 21 },
      ],
      lastFetchedAt: now,
      lastSuccessfulAt: now,
      lastError: undefined,
    };
    if (existing) {
      await ctx.db.patch(existing._id, row);
    } else {
      await ctx.db.insert("players", row);
    }
    return { ok: true };
  },
});

export const clearTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    await Promise.all(players.map((p) => ctx.db.delete(p._id)));
    const snapshots = await ctx.db.query("snapshots").collect();
    await Promise.all(snapshots.map((s) => ctx.db.delete(s._id)));
    return {
      deletedPlayers: players.length,
      deletedSnapshots: snapshots.length,
    };
  },
});
