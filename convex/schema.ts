import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const ROSTER_CATEGORIES = [
  "troops",
  "spells",
  "heroes",
  "siege",
  "buildings",
  "traps",
  "pets",
  "equipment",
] as const;

export const ROSTER_BASES = ["home", "builder", "capital"] as const;

const rosterBaseValidator = v.union(
  v.literal("home"),
  v.literal("builder"),
  v.literal("capital"),
);
const rosterCategoryValidator = v.union(
  v.literal("troops"),
  v.literal("spells"),
  v.literal("heroes"),
  v.literal("siege"),
  v.literal("buildings"),
  v.literal("traps"),
  v.literal("pets"),
  v.literal("equipment"),
);

const villageValidator = v.union(
  v.literal("home"),
  v.literal("builderBase"),
  v.literal("clanCapital"),
);

const cocUnitValidator = v.object({
  name: v.string(),
  level: v.number(),
  maxLevel: v.number(),
  village: v.optional(villageValidator),
  superTroopIsActive: v.optional(v.boolean()),
});

const cocHeroValidator = v.object({
  name: v.string(),
  level: v.number(),
  maxLevel: v.number(),
  village: v.optional(villageValidator),
  equipment: v.optional(
    v.array(
      v.object({
        name: v.string(),
        level: v.number(),
        maxLevel: v.optional(v.number()),
        village: v.optional(villageValidator),
      }),
    ),
  ),
});

const cocBuildingValidator = v.object({
  name: v.string(),
  level: v.number(),
  maxLevel: v.optional(v.number()),
});

export const playerValidator = v.object({
  playerTag: v.string(),
  name: v.string(),
  townHallLevel: v.number(),
  builderHallLevel: v.optional(v.number()),
  expLevel: v.number(),
  trophies: v.number(),
  bestTrophies: v.number(),
  attackWins: v.number(),
  defenseWins: v.number(),
  warStars: v.optional(v.number()),
  donations: v.optional(v.number()),
  donationsReceived: v.optional(v.number()),
  clanCapitalContributions: v.optional(v.number()),
  builderBaseTrophies: v.optional(v.number()),
  bestBuilderBaseTrophies: v.optional(v.number()),
  clanName: v.optional(v.string()),
  clanTag: v.optional(v.string()),
  clanLevel: v.optional(v.number()),
  clanBadgeUrls: v.optional(
    v.object({
      small: v.optional(v.string()),
      medium: v.optional(v.string()),
      large: v.optional(v.string()),
    }),
  ),
  leagueId: v.optional(v.number()),
  leagueName: v.optional(v.string()),
  leagueIconUrls: v.optional(
    v.object({
      small: v.optional(v.string()),
      large: v.optional(v.string()),
    }),
  ),
  builderLeagueId: v.optional(v.number()),
  builderLeagueName: v.optional(v.string()),
  troops: v.array(cocUnitValidator),
  spells: v.array(cocUnitValidator),
  heroes: v.array(cocHeroValidator),
  heroEquipment: v.optional(v.array(cocUnitValidator)),
  buildings: v.array(cocBuildingValidator),
  lastFetchedAt: v.number(),
  lastSuccessfulAt: v.number(),
  lastError: v.optional(v.string()),
  verifiedAt: v.optional(v.number()),
});

export default defineSchema({
  players: defineTable(playerValidator).index("by_playerTag", ["playerTag"]),

  snapshots: defineTable({
    playerTag: v.string(),
    fetchedAt: v.number(),
    data: playerValidator,
  }).index("by_playerTag_fetchedAt", ["playerTag", "fetchedAt"]),

  battleLogs: defineTable({
    playerTag: v.string(),
    fetchedAt: v.number(),
    items: v.array(
      v.object({
        battleType: v.string(),
        attack: v.boolean(),
        armyShareCode: v.optional(v.string()),
        opponentPlayerTag: v.string(),
        opponentName: v.string(),
        opponentTownHallLevel: v.optional(v.number()),
        stars: v.number(),
        destructionPercentage: v.number(),
        lootedResources: v.optional(
          v.array(v.object({ name: v.string(), amount: v.number() })),
        ),
        extraLootedResources: v.optional(
          v.array(v.object({ name: v.string(), amount: v.number() })),
        ),
        availableLoot: v.optional(
          v.array(v.object({ name: v.string(), amount: v.number() })),
        ),
        battleTime: v.optional(v.number()),
        battleTimestamp: v.string(),
      }),
    ),
  }).index("by_playerTag_fetchedAt", ["playerTag", "fetchedAt"]),

  roster: defineTable({
    base: rosterBaseValidator,
    category: rosterCategoryValidator,
    name: v.string(),
    aliases: v.array(v.string()),
    maxLevel: v.number(),
    imageUrl: v.string(),
  })
    .index("by_name", ["name"])
    .index("by_base_category", ["base", "category"]),
});
