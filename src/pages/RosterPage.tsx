import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  findRosterEntry,
  groupByCategory,
  unitProgress,
  type RosterCategory,
  type CocUnit,
} from "@/lib/roster";
import { useAppStore } from "@/store/useAppStore";
import { usePlayerData } from "@/hooks/usePlayerData";

const CATEGORY_LABELS: Record<RosterCategory, string> = {
  troops: "Troops",
  spells: "Spells",
  heroes: "Heroes",
  siege: "Siege Machines",
  buildings: "Buildings",
  traps: "Traps",
  pets: "Pets",
  equipment: "Hero Equipment",
};

const CATEGORY_SOURCE: Record<
  RosterCategory,
  "troops" | "spells" | "heroes" | "heroEquipment" | "buildings"
> = {
  troops: "troops",
  spells: "spells",
  heroes: "heroes",
  siege: "troops",
  buildings: "buildings",
  traps: "buildings",
  pets: "troops",
  equipment: "heroEquipment",
};

const INFO_ONLY: Record<RosterCategory, boolean> = {
  buildings: true,
  traps: true,
  troops: false,
  spells: false,
  heroes: false,
  siege: false,
  pets: false,
  equipment: false,
};

function unitsForBase(
  units: (CocUnit & { village?: string })[],
  base: string,
): CocUnit[] {
  if (base === "capital") {
    return units.filter((u) => u.village === "clanCapital");
  }
  if (base === "builder") {
    return units.filter((u) => u.village === "builderBase");
  }
  return units.filter((u) => !u.village || u.village === "home");
}

export function RosterPage() {
  const playerTag = useAppStore((s) => s.playerTag);
  const activeBase = useAppStore((s) => s.activeBase);
  const setActiveBase = useAppStore((s) => s.setActiveBase);

  const { player, roster, loading } = usePlayerData(playerTag ?? "");

  const [tab, setTab] = useState<string>("troops");

  const units = useMemo(() => {
    if (!player) {
      return {
        troops: [] as CocUnit[],
        spells: [] as CocUnit[],
        heroes: [] as CocUnit[],
        heroEquipment: [] as CocUnit[],
        buildings: [] as CocUnit[],
      };
    }
    return {
      troops: unitsForBase(player.troops, activeBase),
      spells: unitsForBase(player.spells, activeBase),
      heroes: unitsForBase(player.heroes, activeBase),
      heroEquipment: player.heroEquipment ?? [],
      buildings: player.buildings ?? [],
    };
  }, [player, activeBase]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <h2 className="text-lg font-semibold">No player data</h2>
        <p className="text-muted-foreground text-sm">
          Sync your player from the Setup page first.
        </p>
      </div>
    );
  }

  const baseEntries = roster.filter((e) => e.base === activeBase);
  const grouped = groupByCategory(baseEntries);
  const currentTab = tab as RosterCategory;

  const renderTile = (category: RosterCategory, name: string) => {
    const entry = findRosterEntry(name, activeBase, baseEntries);
    if (!entry) return null;

    if (INFO_ONLY[category]) {
      return (
        <Tooltip key={entry.name}>
          <TooltipTrigger asChild>
            <div className="border-border bg-card hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors">
              <div className="relative">
                <img
                  src={entry.imageUrl}
                  alt={entry.name}
                  className="h-14 w-14 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="w-full text-center">
                <p className="truncate text-xs font-medium">{entry.name}</p>
                <p className="text-muted-foreground text-[10px]">
                  Up to Lv {entry.maxLevel}
                </p>
              </div>
              <Progress value={100} className="h-1.5 opacity-30" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {entry.name}: max level {entry.maxLevel}. Building levels are not
              exposed by the CoC API.
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    const sourceKey = CATEGORY_SOURCE[category];
    const unitList = units[sourceKey] ?? [];
    const playerUnit = unitList.find(
      (u) => u.name.toLowerCase() === name.toLowerCase(),
    );
    const level = playerUnit?.level ?? 0;
    const maxLevel = playerUnit?.maxLevel ?? entry.maxLevel;
    const progress = unitProgress({ level, maxLevel });
    const maxed = level > 0 && level >= maxLevel;
    const locked = level === 0;

    return (
      <Tooltip key={entry.name}>
        <TooltipTrigger asChild>
          <div
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
              maxed
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-border bg-card hover:bg-accent"
            }`}
          >
            <div className="relative">
              <img
                src={entry.imageUrl}
                alt={entry.name}
                className={`h-14 w-14 object-contain ${
                  locked ? "opacity-40 grayscale" : ""
                }`}
                loading="lazy"
              />
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge variant="secondary" className="text-[10px]">
                    Locked
                  </Badge>
                </div>
              )}
            </div>
            <div className="w-full text-center">
              <p className="truncate text-xs font-medium">{entry.name}</p>
              <p className="text-muted-foreground text-[10px]">
                {locked ? "Not unlocked" : `Lv ${level}/${maxLevel}`}
              </p>
            </div>
            <Progress value={progress * 100} className="h-1.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {entry.name}: {locked ? "not unlocked" : `level ${level}`} /{" "}
            {maxLevel}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roster</h1>
          <p className="text-muted-foreground text-sm">
            {player.name} · {player.playerTag}
          </p>
        </div>
      </div>

      <Tabs
        value={activeBase}
        onValueChange={(v) => setActiveBase(v as typeof activeBase)}
      >
        <TabsList>
          <TabsTrigger value="home">Home Village</TabsTrigger>
          <TabsTrigger value="builder">Builder Base</TabsTrigger>
          <TabsTrigger value="capital">Clan Capital</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={currentTab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap">
          {Object.keys(CATEGORY_LABELS).map((key) => (
            <TabsTrigger key={key} value={key}>
              {CATEGORY_LABELS[key as RosterCategory]}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.keys(CATEGORY_LABELS).map((key) => (
          <TabsContent key={key} value={key}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {grouped[key as RosterCategory].map((e) =>
                renderTile(key as RosterCategory, e.name),
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
