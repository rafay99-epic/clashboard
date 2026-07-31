import { expect, test } from "bun:test";
import {
  buildRoster,
  summarize,
  type PlayerData,
  type RosterEntry,
} from "@/lib/roster";

const entry = (p: Partial<RosterEntry>): RosterEntry => ({
  base: "home",
  category: "troops",
  name: "Barbarian",
  aliases: [],
  maxLevel: 12,
  imageUrl: "",
  ...p,
});

const player = {
  troops: [
    { name: "Barbarian", level: 12, maxLevel: 12, village: "home" },
    { name: "L.A.S.S.I", level: 4, maxLevel: 10, village: "home" },
    { name: "Raged Barbarian", level: 3, maxLevel: 18, village: "builderBase" },
  ],
  spells: [],
  heroes: [],
  buildings: [],
} as unknown as PlayerData;

test("joins player levels onto the roster, per base", () => {
  const home = buildRoster(
    player,
    [
      entry({}),
      entry({ category: "pets", name: "L.A.S.S.I", maxLevel: 10 }),
      entry({ category: "troops", name: "Ice Golem", maxLevel: 8 }), 
      entry({ base: "builder", name: "Raged Barbarian", maxLevel: 18 }),
    ],
    "home",
  );

  expect(home.troops.map((u) => [u.name, u.level, u.maxed, u.locked])).toEqual([
    ["Barbarian", 12, true, false],
    ["Ice Golem", 0, false, true],
  ]);
  expect(home.pets[0]).toMatchObject({ level: 4, maxed: false, locked: false });
  expect(home.troops.find((u) => u.name === "Raged Barbarian")).toBeUndefined();

  const builder = buildRoster(
    player,
    [entry({ base: "builder", name: "Raged Barbarian", maxLevel: 18 })],
    "builder",
  );
  expect(builder.troops[0].level).toBe(3);
});

test("matches by alias and treats buildings as info-only", () => {
  const grouped = buildRoster(
    player,
    [
      entry({ name: "Barb", aliases: ["Barbarian"] }),
      entry({ category: "buildings", name: "Archer Tower", maxLevel: 21 }),
    ],
    "home",
  );
  expect(grouped.troops[0].level).toBe(12);
  expect(grouped.buildings[0]).toMatchObject({
    infoOnly: true,
    maxed: false,
    locked: false,
  });
});

test("summarize counts owned and maxed", () => {
  const units = buildRoster(
    player,
    [
      entry({}),
      entry({ name: "Ice Golem", maxLevel: 8 }),
      entry({ category: "pets", name: "L.A.S.S.I", maxLevel: 10 }),
    ],
    "home",
  ).troops;
  expect(summarize(units)).toEqual({
    total: 2,
    owned: 1,
    locked: 1,
    maxed: 1,
    progress: 0.5, 
    maxedShare: 0.5,
    remaining: 8, 
  });
});
