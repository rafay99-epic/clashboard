import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { normalizePlayerTag } from "./lib/constants";
import { listLinks, requireLink, requireUser } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await requireUser(ctx).catch(() => null);
    if (!user) return [];
    const links = await listLinks(ctx, user._id);
    return links
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((link) => ({
        playerTag: link.playerTag,
        name: link.name,
        verifiedAt: link.verifiedAt,
        createdAt: link.createdAt,
      }));
  },
});

export const link = mutation({
  args: {
    playerTag: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const playerTag = normalizePlayerTag(args.playerTag);
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_userId_playerTag", (q) =>
        q.eq("userId", user._id).eq("playerTag", playerTag),
      )
      .first();

    if (existing) {
      if (existing.name !== args.name) {
        await ctx.db.patch(existing._id, { name: args.name });
      }
      return playerTag;
    }

    await ctx.db.insert("accounts", {
      userId: user._id,
      playerTag,
      name: args.name,
      createdAt: Date.now(),
    });
    return playerTag;
  },
});

export const unlink = mutation({
  args: { playerTag: v.string() },
  handler: async (ctx, args) => {
    const existing = await requireLink(ctx, args.playerTag);
    await ctx.db.delete(existing._id);
    return normalizePlayerTag(args.playerTag);
  },
});

export const markVerified = internalMutation({
  args: {
    clerkId: v.string(),
    playerTag: v.string(),
    verifiedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return;
    const playerTag = normalizePlayerTag(args.playerTag);
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_userId_playerTag", (q) =>
        q.eq("userId", user._id).eq("playerTag", playerTag),
      )
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, { verifiedAt: args.verifiedAt });
  },
});

export const isLinked = query({
  args: { playerTag: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx).catch(() => null);
    if (!user) return false;
    const link = await ctx.db
      .query("accounts")
      .withIndex("by_userId_playerTag", (q) =>
        q
          .eq("userId", user._id)
          .eq("playerTag", normalizePlayerTag(args.playerTag)),
      )
      .first();
    return Boolean(link);
  },
});
