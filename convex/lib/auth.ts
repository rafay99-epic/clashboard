import type { Doc, Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { normalizePlayerTag } from "./constants";

export const AUTH_REQUIRED = "Sign in to continue.";
export const NOT_LINKED = "That player tag is not linked to your account.";

type ReadCtx = QueryCtx | MutationCtx;

export async function requireClerkId(
  ctx: ReadCtx | ActionCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error(AUTH_REQUIRED);
  return identity.subject;
}

export async function findUser(
  ctx: ReadCtx,
  clerkId: string,
): Promise<Doc<"users"> | null> {
  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();
}

export async function requireUser(ctx: ReadCtx): Promise<Doc<"users">> {
  const clerkId = await requireClerkId(ctx);
  const user = await findUser(ctx, clerkId);
  if (!user) throw new Error(AUTH_REQUIRED);
  return user;
}

export async function listLinks(
  ctx: ReadCtx,
  userId: Id<"users">,
): Promise<Doc<"accounts">[]> {
  return ctx.db
    .query("accounts")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
}

export async function requireLink(
  ctx: ReadCtx,
  playerTag: string,
): Promise<Doc<"accounts">> {
  const user = await requireUser(ctx);
  const tag = normalizePlayerTag(playerTag);
  const link = await ctx.db
    .query("accounts")
    .withIndex("by_userId_playerTag", (q) =>
      q.eq("userId", user._id).eq("playerTag", tag),
    )
    .first();
  if (!link) throw new Error(NOT_LINKED);
  return link;
}

export function ownsTag(
  links: { playerTag: string }[],
  playerTag: string,
): boolean {
  const tag = normalizePlayerTag(playerTag);
  return links.some((link) => normalizePlayerTag(link.playerTag) === tag);
}
