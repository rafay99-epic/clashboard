import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findUser, requireClerkId } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await findUser(ctx, identity.subject);
    if (!user) return null;
    return {
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },
});

export const ensureUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkId(ctx);
    const existing = await findUser(ctx, clerkId);

    if (existing) {
      const changed =
        (args.name !== undefined && args.name !== existing.name) ||
        (args.email !== undefined && args.email !== existing.email);
      if (changed) {
        await ctx.db.patch(existing._id, {
          name: args.name ?? existing.name,
          email: args.email ?? existing.email,
        });
      }
      return existing._id;
    }

    return ctx.db.insert("users", {
      clerkId,
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
    });
  },
});
