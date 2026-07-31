import { useQuery as useConvexQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { PlayerData, RosterEntry } from "@/lib/roster";
import { normalizeTag } from "@/lib/roster";

export function usePlayerData(playerTag: string) {
  const normalized = normalizeTag(playerTag);
  const player = useConvexQuery(api.players.queries.getPlayer, {
    playerTag: normalized,
  });
  const roster = useConvexQuery(api.roster.queries.getRoster, {});

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
    loading: player === undefined || roster === undefined,
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

export function useBattleLog(playerTag: string) {
  const normalized = normalizeTag(playerTag);
  const log = useConvexQuery(api.battles.queries.getBattleLog, {
    playerTag: normalized,
  });
  const items: BattleEntry[] = (log?.items ?? []) as BattleEntry[];
  return {
    items,
    fetchedAt: log?.fetchedAt ?? null,
    loading: log === undefined,
  };
}
