import type { CocPlayer } from "../lib/types";
import { normalizePlayerTag } from "../lib/constants";

export type NormalizedPlayer = {
  playerTag: string;
  name: string;
  townHallLevel: number;
  builderHallLevel?: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  attackWins: number;
  defenseWins: number;
  warStars: number;
  donations: number;
  donationsReceived: number;
  clanCapitalContributions: number;
  builderBaseTrophies: number;
  bestBuilderBaseTrophies: number;
  clanName?: string;
  clanTag?: string;
  clanLevel?: number;
  clanBadgeUrls?: { small?: string; medium?: string; large?: string };
  leagueId?: number;
  leagueName?: string;
  leagueIconUrls?: { small?: string; large?: string };
  builderLeagueId?: number;
  builderLeagueName?: string;
  troops: CocPlayer["troops"];
  spells: CocPlayer["spells"];
  heroes: CocPlayer["heroes"];
  heroEquipment: CocPlayer["heroEquipment"];
  buildings: CocPlayer["buildings"];
  lastFetchedAt: number;
  lastSuccessfulAt: number;
};

export function normalizePlayer(
  p: CocPlayer,
  playerTag: string,
): NormalizedPlayer {
  const now = Date.now();
  return {
    playerTag: normalizePlayerTag(playerTag),
    name: p.name ?? playerTag,
    townHallLevel: p.townHallLevel ?? 1,
    builderHallLevel: p.builderHallLevel,
    expLevel: p.expLevel ?? 0,
    trophies: p.trophies ?? 0,
    bestTrophies: p.bestTrophies ?? 0,
    attackWins: p.attackWins ?? 0,
    defenseWins: p.defenseWins ?? 0,
    warStars: p.warStars ?? 0,
    donations: p.donations ?? 0,
    donationsReceived: p.donationsReceived ?? 0,
    clanCapitalContributions: p.clanCapitalContributions ?? 0,
    builderBaseTrophies: p.builderBaseTrophies ?? 0,
    bestBuilderBaseTrophies: p.bestBuilderBaseTrophies ?? 0,
    clanName: p.clan?.name,
    clanTag: p.clan?.tag,
    clanLevel: p.clan?.clanLevel,
    clanBadgeUrls: p.clan?.badgeUrls,
    leagueId: p.leagueTier?.id,
    leagueName: p.leagueTier?.name,
    leagueIconUrls: p.leagueTier?.iconUrls,
    builderLeagueId: p.builderBaseLeague?.id,
    builderLeagueName: p.builderBaseLeague?.name,
    troops: p.troops ?? [],
    spells: p.spells ?? [],
    heroes: p.heroes ?? [],
    heroEquipment: p.heroEquipment ?? [],
    buildings: p.buildings ?? [],
    lastFetchedAt: now,
    lastSuccessfulAt: now,
  };
}
