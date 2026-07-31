/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as battles_queries from "../battles/queries.js";
import type * as battles_sync from "../battles/sync.js";
import type * as coc_battlelog from "../coc/battlelog.js";
import type * as coc_fetch from "../coc/fetch.js";
import type * as coc_request from "../coc/request.js";
import type * as coc_verify from "../coc/verify.js";
import type * as crons from "../crons.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_rateLimiter from "../lib/rateLimiter.js";
import type * as lib_types from "../lib/types.js";
import type * as players_normalize from "../players/normalize.js";
import type * as players_queries from "../players/queries.js";
import type * as players_sync from "../players/sync.js";
import type * as players_verify from "../players/verify.js";
import type * as roster_queries from "../roster/queries.js";
import type * as roster_seed from "../roster/seed.js";
import type * as sync_cron from "../sync/cron.js";
import type * as sync_workflows from "../sync/workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "battles/queries": typeof battles_queries;
  "battles/sync": typeof battles_sync;
  "coc/battlelog": typeof coc_battlelog;
  "coc/fetch": typeof coc_fetch;
  "coc/request": typeof coc_request;
  "coc/verify": typeof coc_verify;
  crons: typeof crons;
  "lib/constants": typeof lib_constants;
  "lib/env": typeof lib_env;
  "lib/rateLimiter": typeof lib_rateLimiter;
  "lib/types": typeof lib_types;
  "players/normalize": typeof players_normalize;
  "players/queries": typeof players_queries;
  "players/sync": typeof players_sync;
  "players/verify": typeof players_verify;
  "roster/queries": typeof roster_queries;
  "roster/seed": typeof roster_seed;
  "sync/cron": typeof sync_cron;
  "sync/workflows": typeof sync_workflows;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
};
