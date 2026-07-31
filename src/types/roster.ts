export type RosterBase = "home" | "builder" | "capital";

export type RosterCategory =
  | "troops"
  | "spells"
  | "heroes"
  | "siege"
  | "buildings"
  | "traps"
  | "pets"
  | "equipment";

export interface RosterEntry {
  base: RosterBase;
  category: RosterCategory;
  name: string;
  aliases: string[];
  maxLevel: number;
  imageUrl: string;
}

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

export interface RosterSummary {
  total: number;
  owned: number;
  locked: number;
  maxed: number;
  progress: number;
  maxedShare: number;
  remaining: number;
}
