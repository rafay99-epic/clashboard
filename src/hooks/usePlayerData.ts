import { useQuery as useConvexQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { PlayerData, RosterEntry } from "@/lib/roster";
import { normalizeTag } from "@/lib/roster";

export function usePlayerData(playerTag: string | null) {
  const normalized = playerTag ? normalizeTag(playerTag) : null;
  const player = useConvexQuery(
    api.players.queries.getPlayer,
    normalized ? { playerTag: normalized } : "skip",
  );
  const roster = useConvexQuery(
    api.roster.queries.getRoster,
    normalized ? {} : "skip",
  );

  const entries: RosterEntry[] = (roster ?? []).map((r) => ({
    base: r.base,
    category: r.category,
    name: r.name,
    aliases: r.aliases,
    maxLevel: r.maxLevel,
    imageUrl: r.imageUrl,
  }));

  return {
    player: (player as PlayerData | null) ?? null,
    roster: entries,
    loading:
      Boolean(normalized) && (player === undefined || roster === undefined),
  };
}

export interface BattleEntry {
  battleType: string;
  attack: boolean;
  armyShareCode?: string;
  opponentPlayerTag: string;
  opponentName: string;
  opponentTownHallLevel?: number;
  stars: number;
  destructionPercentage: number;
  lootedResources?: { name: string; amount: number }[];
  extraLootedResources?: { name: string; amount: number }[];
  availableLoot?: { name: string; amount: number }[];
  battleTime?: number;
  battleTimestamp: string;
}

export function useBattleLog(playerTag: string | null) {
  const normalized = playerTag ? normalizeTag(playerTag) : null;
  const log = useConvexQuery(
    api.battles.queries.getBattleLog,
    normalized ? { playerTag: normalized } : "skip",
  );
  const items: BattleEntry[] = (log?.items ?? []) as BattleEntry[];
  return {
    items,
    fetchedAt: log?.fetchedAt ?? null,
    loading: Boolean(normalized) && log === undefined,
  };
}
