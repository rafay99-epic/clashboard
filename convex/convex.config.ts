import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import workflow from "@convex-dev/workflow/convex.config.js";

const app = defineApp();

app.use(rateLimiter);
app.use(workflow);

export default app;
