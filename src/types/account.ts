import type { RosterBase } from "./roster";

export type BaseTab = RosterBase;

export type SyncStatus = "idle" | "syncing" | "error";

export interface TrackedAccount {
  playerTag: string;
  name: string;
  verifiedAt?: number;
  createdAt: number;
}

export interface CurrentUser {
  clerkId: string;
  name?: string;
  email?: string;
}
