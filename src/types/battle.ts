export interface BattleResource {
  name: string;
  amount: number;
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
  lootedResources?: BattleResource[];
  extraLootedResources?: BattleResource[];
  availableLoot?: BattleResource[];
  battleTime?: number;
  battleTimestamp: string;
}

export interface BattleLog {
  playerTag: string;
  fetchedAt: number;
  items: BattleEntry[];
}
