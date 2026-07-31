import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../node_modules/clash-of-clans-data/data");
const OUT_DIR = join(__dirname, "../src/data");
const OUT_FILE = join(OUT_DIR, "roster-manifest.json");
const PUBLIC_IMAGES = join(__dirname, "../public/images");

type Category =
  | "troops"
  | "spells"
  | "heroes"
  | "siege"
  | "buildings"
  | "traps"
  | "pets"
  | "equipment";

const BASE_CATEGORIES: Record<string, Category> = {
  troops: "troops",
  spells: "spells",
  heroes: "heroes",
  "siege-machines": "siege",
  defenses: "buildings",
  "crafted-defenses": "buildings",
  "resource-buildings": "buildings",
  "army-buildings": "buildings",
  "town-hall": "buildings",
  walls: "buildings",
  traps: "traps",
  pets: "pets",
  "hero-equipment": "equipment",
};

interface RosterEntry {
  base: string;
  category: Category;
  name: string;
  aliases: string[];
  maxLevel: number;
  imageUrl: string;
}

interface RosterFile {
  id: string;
  name: string;
  category?: string;
  aliases?: string[];
  images?: { icon?: string };
  levels?: { level?: number; images?: { normal?: string; icon?: string } }[];
}

const entries: RosterEntry[] = [];

function loadDir(base: string, dirPath: string, dirCategory: string) {
  let files: string[];
  try {
    files = readdirSync(dirPath);
  } catch {
    return;
  }
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = readFileSync(join(dirPath, file), "utf-8");
    let data: RosterFile;
    try {
      data = JSON.parse(raw) as RosterFile;
    } catch {
      continue;
    }
    const category = BASE_CATEGORIES[dirCategory ?? ""];
    if (!category) continue;

    const maxLevel = Math.max(
      0,
      ...(data.levels ?? []).map((l) => l.level ?? 0),
    );
    const levels = data.levels ?? [];
    const imageUrl =
      data.images?.icon ??
      levels[levels.length - 1]?.images?.normal ??
      levels[levels.length - 1]?.images?.icon ??
      levels[0]?.images?.normal ??
      "";
    if (!imageUrl || !maxLevel) continue;

    entries.push({
      base,
      category,
      name: data.name,
      aliases: data.aliases ?? [],
      maxLevel,
      imageUrl,
    });
  }
}

for (const cat of Object.keys(BASE_CATEGORIES)) {
  loadDir("home", join(DATA_DIR, "home", cat), cat);
}
loadDir("builder", join(DATA_DIR, "builder", "troops"), "troops");
loadDir("builder", join(DATA_DIR, "builder", "defenses"), "defenses");
loadDir(
  "builder",
  join(DATA_DIR, "builder", "army-buildings"),
  "army-buildings",
);
loadDir(
  "builder",
  join(DATA_DIR, "builder", "resource-buildings"),
  "resource-buildings",
);
loadDir("builder", join(DATA_DIR, "builder", "traps"), "traps");
loadDir("builder", join(DATA_DIR, "builder", "heroes"), "heroes");
loadDir("capital", join(DATA_DIR, "clan-capital", "troops"), "troops");
loadDir("capital", join(DATA_DIR, "clan-capital", "spells"), "spells");
loadDir("capital", join(DATA_DIR, "clan-capital", "defenses"), "defenses");
loadDir(
  "capital",
  join(DATA_DIR, "clan-capital", "army-buildings"),
  "army-buildings",
);

const seen = new Set<string>();
const unique = entries.filter((e) => {
  const key = `${e.base}|${e.category}|${e.name}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

unique.sort((a, b) =>
  `${a.base}|${a.category}|${a.name}`.localeCompare(
    `${b.base}|${b.category}|${b.name}`,
  ),
);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(unique, null, 2) + "\n");

mkdirSync(PUBLIC_IMAGES, { recursive: true });
let copied = 0;
for (const entry of unique) {
  const rel = entry.imageUrl;
  const src = join(__dirname, "../node_modules/clash-of-clans-data", rel);
  const dest = join(__dirname, "../public", rel);
  try {
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    copied++;
  } catch (err) {
    void err;
  }
}

console.log(`Wrote ${unique.length} roster entries to ${OUT_FILE}`);
console.log(`Copied ${copied} images to public/images`);

const ARMY_BUCKETS: { dir: string; prefix: string; base: number }[] = [
  { dir: "troops", prefix: "u", base: 4_000_000 },
  { dir: "siege-machines", prefix: "u", base: 4_000_000 },
  { dir: "spells", prefix: "s", base: 26_000_000 },
  { dir: "heroes", prefix: "h", base: 28_000_000 },
  { dir: "pets", prefix: "p", base: 73_000_000 },
  { dir: "hero-equipment", prefix: "e", base: 90_000_000 },
];

interface ArmyFile extends RosterFile {
  dataId?: number;
  housingSpace?: number;
}

type ArmyIndex = Record<
  string,
  Record<string, { name: string; image: string; housing?: number }>
>;

const armyIndex: ArmyIndex = { u: {}, s: {}, h: {}, p: {}, e: {} };
const armyImages: string[] = [];

for (const bucket of ARMY_BUCKETS) {
  const dirPath = join(DATA_DIR, "home", bucket.dir);
  let files: string[];
  try {
    files = readdirSync(dirPath);
  } catch {
    continue;
  }
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    let data: ArmyFile;
    try {
      data = JSON.parse(readFileSync(join(dirPath, file), "utf-8")) as ArmyFile;
    } catch {
      continue;
    }
    if (typeof data.dataId !== "number" || data.dataId < bucket.base) continue;
    const levels = data.levels ?? [];
    const image =
      data.images?.icon ??
      levels[levels.length - 1]?.images?.icon ??
      levels[levels.length - 1]?.images?.normal ??
      "";
    if (!image) continue;
    armyIndex[bucket.prefix][String(data.dataId % 1_000_000)] = {
      name: data.name,
      image,
      ...(data.housingSpace ? { housing: data.housingSpace } : {}),
    };
    armyImages.push(image);
  }
}

const ARMY_FILE = join(OUT_DIR, "army-index.json");
writeFileSync(ARMY_FILE, JSON.stringify(armyIndex, null, 2) + "\n");

let armyCopied = 0;
for (const rel of armyImages) {
  try {
    const dest = join(__dirname, "../public", rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(__dirname, "../node_modules/clash-of-clans-data", rel), dest);
    armyCopied++;
  } catch (err) {
    void err;
  }
}

const armyCount = Object.values(armyIndex).reduce(
  (acc, bucket) => acc + Object.keys(bucket).length,
  0,
);
console.log(`Wrote ${armyCount} army entries to ${ARMY_FILE}`);
console.log(`Copied ${armyCopied} army icons to public/images`);
