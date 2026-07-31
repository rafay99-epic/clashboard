import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync-all-players",
  { minutes: 15 },
  internal.sync.cron.syncAllPlayers,
);

export default crons;
