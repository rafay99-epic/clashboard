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
