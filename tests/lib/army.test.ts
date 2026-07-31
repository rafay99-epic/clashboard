import { expect, test } from "bun:test";
import { parseArmy, armyLink } from "@/lib/army";

const REAL =
  "h1p9e17_20-2p2e24_22-4p3e13_40-7p10e52_57i1x87-1x64-1x147d1x120u1x95-2x7-1x82-5x15-5x132-4x53-1x97-1x110-1x123-1x6-1x10s1x123-1x2-3x5-3x35-1x98";

test("decodes a real battle log army code", () => {
  const army = parseArmy(REAL)!;

  expect(army.heroes.map((h) => h.name)).toEqual([
    "Archer Queen",
    "Grand Warden",
    "Royal Champion",
    "Dragon Duke",
  ]);
  expect(army.heroes[0].pet?.name).toBe("Frosty");
  expect(army.heroes[0].equipment.map((e) => e.name)).toEqual([
    "Giant Arrow",
    "Healer Puppet",
  ]);

  expect(army.troops[0]).toMatchObject({ name: "Witch", count: 5 });
  expect(army.troops.find((t) => t.name === "Electro Titan")?.count).toBe(1);
  expect(army.housing).toBeGreaterThan(100);

  expect(army.spells.find((s) => s.name === "Freeze Spell")?.count).toBe(3);
  expect(army.unknown).toBe(1);
});

test("returns null for missing or undecodable codes", () => {
  expect(parseArmy(undefined)).toBeNull();
  expect(parseArmy("")).toBeNull();
  expect(parseArmy("i1x87d1x120")).toBeNull(); 
});

test("army link points at the Supercell deep link", () => {
  expect(armyLink("u1x0")).toBe(
    "https://link.clashofclans.com/en?action=CopyArmy&army=u1x0",
  );
});
