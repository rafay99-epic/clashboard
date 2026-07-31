import type { FunctionReference } from "convex/server";
import { rateLimiter } from "../lib/rateLimiter";
import { COC_API_BASE } from "../lib/constants";
import { getCocApiToken } from "../lib/env";
import { CocApiError } from "../lib/types";

const RATE_KEY = "shared";

interface RequestCtx {
  runQuery: (
    fn: FunctionReference<"query", "public" | "internal">,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  runMutation: (
    fn: FunctionReference<"mutation", "public" | "internal">,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
}

export async function cocRequest<T>(ctx: RequestCtx, path: string): Promise<T> {
  const secret = getCocApiToken();

  let lastError: CocApiError | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const status = await rateLimiter.limit(ctx, "cocApi", {
      key: RATE_KEY,
    });
    if (status.ok === false) {
      if (attempt === 4) {
        throw new CocApiError(
          429,
          "CoC API rate limit reached. Try again in a minute.",
          status.retryAfter,
        );
      }
      await new Promise((r) => setTimeout(r, status.retryAfter));
    }

    const res = await fetch(`${COC_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
    });

    if (res.status === 429) {
      const retryAfterSec = Number(res.headers.get("Retry-After") ?? "30");
      lastError = new CocApiError(
        429,
        "Rate limited by Clash of Clans API",
        retryAfterSec * 1000,
      );
      if (attempt < 4) {
        await new Promise((r) =>
          setTimeout(r, Math.min(retryAfterSec * 1000, 30_000)),
        );
        continue;
      }
      break;
    }

    if (res.status === 403) {
      throw new CocApiError(
        403,
        "API token rejected (403). Check COC_API_TOKEN and that the server IP is allowed on the key.",
      );
    }
    if (res.status === 404) {
      throw new CocApiError(404, "Resource not found.");
    }
    if (res.status >= 500) {
      lastError = new CocApiError(res.status, "CoC API server error");
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 1_000 * 2 ** attempt + 500));
        continue;
      }
      break;
    }
    if (!res.ok) {
      throw new CocApiError(res.status, `CoC API error (${res.status})`);
    }

    return (await res.json()) as T;
  }

  throw lastError ?? new CocApiError(500, "Unknown CoC API failure");
}
