import { v } from "convex/values";
import { action } from "../_generated/server";
import { encodePlayerTag } from "../lib/constants";
import { cocRequest } from "./request";

export interface VerifyTokenResponse {
  tag: string;
  token: string;
  status: string;
}

export const verifyPlayerToken = action({
  args: {
    playerTag: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args): Promise<VerifyTokenResponse> => {
    const encodedTag = encodePlayerTag(args.playerTag);
    return cocRequest<VerifyTokenResponse>(
      ctx,
      `/players/${encodedTag}/verifytoken`,
      { token: args.token.trim() },
    );
  },
});
