import index from "../data/army-index.json";
import type { Army, ArmyBucket, ArmyIndex, ArmyItem, ArmyHero } from "@/types";

export type { Army, ArmyItem, ArmyHero };

const lookup = (bucket: ArmyBucket, id: number) =>
  (index as ArmyIndex)[bucket]?.[String(id)];

export function parseArmy(code: string | undefined | null): Army | null {
  if (!code) return null;

  const army: Army = {
    heroes: [],
    troops: [],
    spells: [],
    unknown: 0,
    housing: 0,
  };

  for (const segment of code.split(/(?=[hidus])/)) {
    const marker = segment[0] as ArmyBucket | "i" | "d";
    const body = segment.slice(1);
    if (!body) continue;

    if (marker === "h") {
      for (const item of body.split("-")) {
        const [heroPart, ...rest] = item.split("e");
        const [heroId, petId] = heroPart.split("p").map(Number);
        const hero = lookup("h", heroId);
        if (!hero) {
          army.unknown++;
          continue;
        }
        const pet = petId === undefined ? undefined : lookup("p", petId);
        const equipment = (rest.join("e").split("_") ?? [])
          .map((raw) => lookup("e", Number(raw)))
          .filter((e): e is { name: string; image: string } => Boolean(e));
        army.heroes.push({
          id: heroId,
          name: hero.name,
          image: hero.image,
          pet: pet ? { name: pet.name, image: pet.image } : undefined,
          equipment,
        });
      }
      continue;
    }

    if (marker !== "u" && marker !== "s") continue;

    for (const item of body.split("-")) {
      const [count, id] = item.split("x").map(Number);
      if (!Number.isFinite(count) || !Number.isFinite(id)) continue;
      const entry = lookup(marker, id);
      if (!entry) {
        army.unknown += count;
        continue;
      }
      const target = marker === "u" ? army.troops : army.spells;
      target.push({
        id,
        name: entry.name,
        image: entry.image,
        count,
        housing: entry.housing,
      });
      army.housing += (entry.housing ?? 0) * count;
    }
  }

  if (!army.heroes.length && !army.troops.length && !army.spells.length) {
    return null;
  }
  army.troops.sort((a, b) => b.count - a.count);
  return army;
}

export function armyLink(code: string): string {
  return `https://link.clashofclans.com/en?action=CopyArmy&army=${code}`;
}
