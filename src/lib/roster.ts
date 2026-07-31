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

export const CATEGORY_LABELS: Record<RosterCategory, string> = {
  heroes: "Heroes",
  equipment: "Hero Equipment",
  pets: "Pets",
  troops: "Troops",
  spells: "Spells",
  siege: "Siege Machines",
  buildings: "Buildings",
  traps: "Traps",
};

export const CATEGORY_ORDER: RosterCategory[] = [
  "heroes",
  "equipment",
  "pets",
  "troops",
  "spells",
  "siege",
  "buildings",
  "traps",
];

export const INFO_ONLY: ReadonlySet<RosterCategory> = new Set([
  "buildings",
  "traps",
]);

const CATEGORY_SOURCE: Record<
  RosterCategory,
  "troops" | "spells" | "heroes" | "heroEquipment" | null
> = {
  troops: "troops",
  spells: "spells",
  heroes: "heroes",
  siege: "troops",
  pets: "troops",
  equipment: "heroEquipment",
  buildings: null,
  traps: null,
};

export interface RosterUnit {
  name: string;
  imageUrl: string;
  category: RosterCategory;
  level: number;
  maxLevel: number;
  locked: boolean;
  maxed: boolean;
  infoOnly: boolean;
}

function inBase(unit: CocUnit, base: RosterBase): boolean {
  if (base === "capital") return unit.village === "clanCapital";
  if (base === "builder") return unit.village === "builderBase";
  return !unit.village || unit.village === "home";
}

function matches(entry: RosterEntry, unitName: string): boolean {
  const lowered = unitName.toLowerCase();
  return (
    entry.name.toLowerCase() === lowered ||
    entry.aliases.some((a) => a.toLowerCase() === lowered)
  );
}

export function buildRoster(
  player: PlayerData | null,
  entries: RosterEntry[],
  base: RosterBase,
): Record<RosterCategory, RosterUnit[]> {
  const out = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, [] as RosterUnit[]]),
  ) as Record<RosterCategory, RosterUnit[]>;
  const pools = {
    troops: (player?.troops ?? []).filter((u) => inBase(u, base)),
    spells: (player?.spells ?? []).filter((u) => inBase(u, base)),
    heroes: (player?.heroes ?? []).filter((u) => inBase(u, base)),
    heroEquipment: player?.heroEquipment ?? [],
  };

  for (const entry of entries) {
    if (entry.base !== base) continue;
    const source = CATEGORY_SOURCE[entry.category];
    const infoOnly = INFO_ONLY.has(entry.category);
    const owned = source
      ? pools[source].find((u) => matches(entry, u.name))
      : undefined;
    const level = owned?.level ?? 0;
    const maxLevel = owned?.maxLevel ?? entry.maxLevel;
    out[entry.category].push({
      name: entry.name,
      imageUrl: entry.imageUrl,
      category: entry.category,
      level,
      maxLevel,
      locked: !infoOnly && level === 0,
      maxed: !infoOnly && level > 0 && level >= maxLevel,
      infoOnly,
    });
  }
  return out;
}

export interface RosterSummary {
  total: number;
  owned: number;
  locked: number;
  maxed: number;
  progress: number;
  maxedShare: number;
  remaining: number;
}

export function summarize(units: RosterUnit[]): RosterSummary {
  const total = units.length;
  const owned = units.filter((u) => !u.locked).length;
  const maxed = units.filter((u) => u.maxed).length;
  const progress = total
    ? units.reduce((acc, u) => acc + unitProgress(u), 0) / total
    : 0;
  const remaining = units.reduce(
    (acc, u) => acc + Math.max(0, u.maxLevel - u.level),
    0,
  );
  return {
    total,
    owned,
    locked: total - owned,
    maxed,
    progress,
    maxedShare: total ? maxed / total : 0,
    remaining,
  };
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
