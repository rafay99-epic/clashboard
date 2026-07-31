export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#/, "").toUpperCase();
}

export interface RosterEntry {
  base: "home" | "builder" | "capital";
  category:
    | "troops"
    | "spells"
    | "heroes"
    | "siege"
    | "buildings"
    | "traps"
    | "pets"
    | "equipment";
  name: string;
  aliases: string[];
  maxLevel: number;
  imageUrl: string;
}

export type RosterBase = RosterEntry["base"];
export type RosterCategory = RosterEntry["category"];

export interface CocUnit {
  name: string;
  level: number;
  maxLevel: number;
  village?: string;
}

export interface CocBuilding {
  name: string;
  level: number;
  maxLevel?: number;
}

export interface PlayerData {
  playerTag: string;
  name: string;
  townHallLevel: number;
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
  clanName?: string;
  clanTag?: string;
  clanLevel?: number;
  clanBadgeUrls?: { small?: string; medium?: string; large?: string };
  leagueId?: number;
  leagueName?: string;
  leagueIconUrls?: { small?: string; large?: string };
  builderLeagueId?: number;
  builderLeagueName?: string;
  troops: CocUnit[];
  spells: CocUnit[];
  heroes: CocUnit[];
  heroEquipment?: CocUnit[];
  buildings: CocBuilding[];
  lastFetchedAt: number;
  lastSuccessfulAt: number;
  lastError?: string;
}

export function findRosterEntry(
  name: string,
  base: RosterBase,
  entries: RosterEntry[],
): RosterEntry | undefined {
  const lowered = name.toLowerCase();
  return entries.find(
    (e) =>
      e.base === base &&
      (e.name.toLowerCase() === lowered ||
        e.aliases.some((a) => a.toLowerCase() === lowered)),
  );
}

export function unitProgress(unit: { level: number; maxLevel?: number }) {
  if (!unit.maxLevel) return 0;
  return Math.min(1, unit.level / unit.maxLevel);
}

export function overallProgress(units: { level: number; maxLevel?: number }[]) {
  if (!units.length) return 0;
  const sum = units.reduce((acc, u) => acc + unitProgress(u), 0);
  return sum / units.length;
}

export function groupByCategory(
  entries: RosterEntry[],
): Record<RosterCategory, RosterEntry[]> {
  const grouped = {
    troops: [],
    spells: [],
    heroes: [],
    siege: [],
    buildings: [],
    traps: [],
    pets: [],
    equipment: [],
  } as Record<RosterCategory, RosterEntry[]>;
  for (const entry of entries) {
    grouped[entry.category].push(entry);
  }
  return grouped;
}
