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

export interface BadgeUrls {
  small?: string;
  medium?: string;
  large?: string;
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
  clanBadgeUrls?: BadgeUrls;
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
  verifiedAt?: number;
}
