import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { encodePlayerTag } from "../lib/constants";
import type { CocBattleLog } from "../lib/types";
import { cocRequest } from "./request";

export const fetchBattleLog = internalAction({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args) => {
    const encodedTag = encodePlayerTag(args.playerTag);
    return cocRequest<CocBattleLog>(ctx, `/players/${encodedTag}/battlelog`);
  },
});
