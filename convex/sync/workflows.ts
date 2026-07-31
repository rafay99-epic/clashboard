import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "../_generated/api";
import { internal } from "../_generated/api";
import type { SyncResult } from "../lib/types";

export const workflow = new WorkflowManager(components.workflow);

export const syncWorkflow = internalMutation({
  args: {
    playerTag: v.string(),
  },
  handler: async (ctx, args) => {
    await workflow.start(ctx, internal.sync.workflows.syncPlayerWorkflow, {
      playerTag: args.playerTag,
    });
  },
});

export const syncPlayerWorkflow = workflow.define({
  args: {
    playerTag: v.string(),
  },
  handler: async (step, args): Promise<SyncResult> => {
    const result = await step.runAction(
      internal.players.sync.syncPlayerInternal,
      { playerTag: args.playerTag },
      { retry: true },
    );

    if (!result.ok) {
      await step.runMutation(internal.players.sync.recordError, {
        playerTag: args.playerTag,
        error: result.error,
      });
    }
    return result;
  },
});
