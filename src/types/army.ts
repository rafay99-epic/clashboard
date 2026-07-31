export interface ArmyItem {
  id: number;
  name: string;
  image: string;
  count: number;
  housing?: number;
}

export interface ArmyPiece {
  name: string;
  image: string;
}

export interface ArmyHero {
  id: number;
  name: string;
  image: string;
  pet?: ArmyPiece;
  equipment: ArmyPiece[];
}

export interface Army {
  heroes: ArmyHero[];
  troops: ArmyItem[];
  spells: ArmyItem[];
  unknown: number;
  housing: number;
}

export type ArmyBucket = "u" | "s" | "h" | "p" | "e";

export interface ArmyIndexEntry {
  name: string;
  image: string;
  housing?: number;
}

export type ArmyIndex = Record<string, Record<string, ArmyIndexEntry>>;
