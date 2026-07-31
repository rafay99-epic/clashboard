import type { FunctionReference } from "convex/server";

export interface CocPlayer {
  tag: string;
  name: string;
  townHallLevel: number;
  townHallWeaponLevel?: number;
  builderHallLevel?: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  attackWins: number;
  defenseWins: number;
  warStars?: number;
  donations?: number;
  donationsReceived?: number;
  clanCapitalContributions?: number;
  builderBaseTrophies?: number;
  bestBuilderBaseTrophies?: number;
  clan?: {
    tag: string;
    name: string;
    clanLevel: number;
    badgeUrls?: { small?: string; medium?: string; large?: string };
  };
  leagueTier?: {
    id: number;
    name: string;
    iconUrls?: { small?: string; large?: string };
  };
  builderBaseLeague?: { id: number; name: string };
  troops?: {
    name: string;
    level: number;
    maxLevel: number;
    village?: string;
    superTroopIsActive?: boolean;
  }[];
  spells?: {
    name: string;
    level: number;
    maxLevel: number;
    village?: string;
  }[];
  heroes?: {
    name: string;
    level: number;
    maxLevel: number;
    village?: string;
    equipment?: {
      name: string;
      level: number;
      maxLevel?: number;
      village?: string;
    }[];
  }[];
  heroEquipment?: {
    name: string;
    level: number;
    maxLevel: number;
    village?: string;
  }[];
  buildings?: { name: string; level: number; maxLevel?: number }[];
}

export interface CocResourceAmount {
  name: string;
  amount: number;
}

export interface CocBattleLogEntry {
  battleType: string;
  attack: boolean;
  armyShareCode?: string;
  opponentPlayerTag: string;
  opponentName: string;
  opponentTownHallLevel?: number;
  stars: number;
  destructionPercentage: number;
  lootedResources?: CocResourceAmount[];
  extraLootedResources?: CocResourceAmount[];
  availableLoot?: CocResourceAmount[];
  battleTime?: number;
  battleTimestamp: string;
}

export interface CocBattleLog {
  items: CocBattleLogEntry[];
}

export class CocApiError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export type SyncResult =
  | { ok: true; fetchedAt: number; name: string }
  | { ok: false; error: string; retryAfterMs?: number };

export interface SyncCtx {
  runAction: (
    fn: FunctionReference<"action", "public" | "internal">,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  runMutation: (
    fn: FunctionReference<"mutation", "public" | "internal">,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
}
