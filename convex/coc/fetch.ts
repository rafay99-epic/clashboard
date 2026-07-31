import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { encodePlayerTag } from "../lib/constants";
import type { CocPlayer } from "../lib/types";
import { cocRequest } from "./request";

export const fetchPlayer = internalAction({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args) => {
    const encodedTag = encodePlayerTag(args.playerTag);
    return cocRequest<CocPlayer>(ctx, `/players/${encodedTag}`);
  },
});
