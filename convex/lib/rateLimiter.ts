import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  cocApi: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 30 },
});
