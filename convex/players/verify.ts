import { v } from "convex/values";
import { action, internalMutation } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { normalizePlayerTag } from "../lib/constants";

export type VerifyResult =
  | { ok: true; verified: boolean; verifiedAt?: number }
  | { ok: false; error: string };

export const verifyOwnership = action({
  args: {
    playerTag: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args): Promise<VerifyResult> => {
    const token = args.token.trim();
    if (!token) {
      return { ok: false, error: "Enter the API token from the game." };
    }

    try {
      const result = await ctx.runAction(api.coc.verify.verifyPlayerToken, {
        playerTag: args.playerTag,
        token,
      });
      const verified = result.status === "ok";
      if (!verified) {
        return { ok: true, verified: false };
      }

      const verifiedAt = Date.now();
      await ctx.runMutation(internal.players.verify.markVerified, {
        playerTag: args.playerTag,
        verifiedAt,
      });
      return { ok: true, verified: true, verifiedAt };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Verification failed",
      };
    }
  },
});

export const markVerified = internalMutation({
  args: {
    playerTag: v.string(),
    verifiedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_playerTag", (q) =>
        q.eq("playerTag", normalizePlayerTag(args.playerTag)),
      )
      .first();
    if (!player) return;
    await ctx.db.patch(player._id, { verifiedAt: args.verifiedAt });
  },
});
