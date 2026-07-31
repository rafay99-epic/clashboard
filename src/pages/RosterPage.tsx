import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  EmptyState,
  ErrorNote,
  Meter,
  SectionHead,
} from "@/components/ui/bits";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlayerData } from "@/hooks/usePlayerData";
import { useSync } from "@/hooks/useSync";
import { useAppStore, type BaseTab } from "@/store/useAppStore";
import {
  buildRoster,
  summarize,
  unitProgress,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type RosterUnit,
} from "@/lib/roster";
import { cn } from "@/lib/utils";

type Filter = "all" | "progress" | "maxed" | "locked";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "progress", label: "In progress" },
  { value: "maxed", label: "Maxed" },
  { value: "locked", label: "Locked" },
];

function keep(unit: RosterUnit, filter: Filter): boolean {
  if (unit.infoOnly) return filter === "all";
  if (filter === "all") return true;
  if (filter === "maxed") return unit.maxed;
  if (filter === "locked") return unit.locked;
  return !unit.locked && !unit.maxed;
}

const BASES: { value: BaseTab; label: string }[] = [
  { value: "home", label: "Home Village" },
  { value: "builder", label: "Builder Base" },
  { value: "capital", label: "Clan Capital" },
];

function Unit({ unit }: { unit: RosterUnit }) {
  const progress = unitProgress(unit);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group flex cursor-default flex-col items-center gap-2">
          <div
            className={cn(
              "relative flex h-[72px] w-[72px] items-center justify-center rounded-full transition-transform duration-200 group-hover:-translate-y-0.5",
              unit.maxed
                ? "ring-primary/60 bg-primary/10 ring-1"
                : "bg-foreground/[0.04]",
              unit.locked && "bg-foreground/[0.02]",
            )}
          >
            <img
              src={unit.imageUrl}
              alt={unit.name}
              loading="lazy"
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              className={cn(
                "h-12 w-12 object-contain",
                unit.locked && "opacity-25 grayscale",
              )}
            />
            {unit.maxed ? (
              <span className="bg-primary text-primary-foreground absolute -right-0.5 -bottom-0.5 rounded-full px-1.5 py-px text-[9px] font-bold tracking-wide">
                MAX
              </span>
            ) : null}
          </div>

          <p className="w-full truncate text-center text-[13px] font-medium">
            {unit.name}
          </p>

          {unit.infoOnly ? (
            <p className="text-muted-foreground tnum text-[11px]">
              max {unit.maxLevel}
            </p>
          ) : (
            <>
              <p
                className={cn(
                  "tnum text-[11px]",
                  unit.locked
                    ? "text-muted-foreground/60"
                    : unit.maxed
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {unit.locked
                  ? "Not unlocked"
                  : `${unit.level} / ${unit.maxLevel}`}
              </p>
              <Meter
                value={progress}
                tone={unit.maxed ? "gold" : unit.locked ? "dim" : "gold"}
                className="w-full max-w-[72px]"
              />
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {unit.infoOnly
          ? `${unit.name} — max level ${unit.maxLevel}. The Clash API does not expose building levels.`
          : unit.locked
            ? `${unit.name} — not unlocked yet (max level ${unit.maxLevel})`
            : unit.maxed
              ? `${unit.name} — maxed at level ${unit.maxLevel}`
              : `${unit.name} — level ${unit.level} of ${unit.maxLevel}, ${
                  unit.maxLevel - unit.level
                } upgrade${unit.maxLevel - unit.level === 1 ? "" : "s"} left`}
      </TooltipContent>
    </Tooltip>
  );
}

function RosterSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-[72px] w-[72px] rounded-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RosterPage() {
  const playerTag = useAppStore((s) => s.playerTag);
  const activeBase = useAppStore((s) => s.activeBase);
  const setActiveBase = useAppStore((s) => s.setActiveBase);
  const { player, roster, loading } = usePlayerData(playerTag ?? "");
  const { sync, syncing, lastError } = useSync();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const grouped = useMemo(
    () => buildRoster(player, roster, activeBase),
    [player, roster, activeBase],
  );

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORY_ORDER.map((key) => {
      const all = grouped[key];
      const units = all.filter(
        (u) => (!q || u.name.toLowerCase().includes(q)) && keep(u, filter),
      );
      return {
        key,
        label: CATEGORY_LABELS[key],
        units,
        summary: summarize(all),
      };
    }).filter((s) => s.units.length > 0);
  }, [grouped, query, filter]);

  const counts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searched = CATEGORY_ORDER.flatMap((c) => grouped[c]).filter(
      (u) => !q || u.name.toLowerCase().includes(q),
    );
    return {
      all: searched.length,
      progress: searched.filter((u) => keep(u, "progress")).length,
      maxed: searched.filter((u) => keep(u, "maxed")).length,
      locked: searched.filter((u) => keep(u, "locked")).length,
    } satisfies Record<Filter, number>;
  }, [grouped, query]);

  const baseCounts = useMemo(() => {
    const per = (base: BaseTab) => {
      const g = buildRoster(player, roster, base);
      return summarize(
        CATEGORY_ORDER.filter((c) => !g[c][0]?.infoOnly).flatMap((c) => g[c]),
      );
    };
    return {
      home: per("home"),
      builder: per("builder"),
      capital: per("capital"),
    };
  }, [player, roster]);

  if (loading) return <RosterSkeleton />;

  const trackable = CATEGORY_ORDER.filter((c) => !grouped[c][0]?.infoOnly);
  const tracked = summarize(trackable.flatMap((c) => grouped[c]));
  const baseLabel = BASES.find((b) => b.value === activeBase)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      {lastError && (
        <ErrorNote message={lastError} onRetry={sync} retrying={syncing} />
      )}

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Roster</h1>
        <p className="text-muted-foreground text-sm">
          {player ? `${player.name} · ` : ""}every unit in the game, with what
          you have unlocked and how far it is from max.
        </p>
      </header>

      <div className="border-hairline flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b pb-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {BASES.map((b) => {
            const active = b.value === activeBase;
            return (
              <button
                key={b.value}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveBase(b.value)}
                className={cn(
                  "group flex items-center gap-2 text-left transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-6 w-[3px] rounded-full transition-colors",
                    active ? "bg-primary" : "bg-foreground/10",
                  )}
                />
                <span className="flex flex-col">
                  <span className="text-[15px] leading-tight font-semibold">
                    {b.label}
                  </span>
                  <span className="text-muted-foreground tnum text-[11px]">
                    {baseCounts[b.value].total
                      ? `${baseCounts[b.value].maxed}/${baseCounts[b.value].total} maxed`
                      : "no data yet"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className="text-muted-foreground tnum text-[11px]">
              {baseLabel} · {tracked.remaining.toLocaleString()} levels left
            </span>
            <div className="flex items-center gap-2">
              <Meter
                value={tracked.progress}
                solid={tracked.maxedShare}
                thick
                className="w-32"
              />
              <span className="tnum text-sm font-semibold">
                {Math.round(tracked.progress * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background/95 border-hairline sticky top-[52px] z-20 -mx-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b px-5 py-2.5 backdrop-blur md:top-0 md:-mx-10 md:px-10">
        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any unit…"
            aria-label="Search units"
            className="border-hairline focus:border-primary/70 placeholder:text-muted-foreground bg-foreground/[0.03] w-full rounded-full border py-2 pr-8 pl-9 text-sm transition-colors outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const count = counts[f.value];
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "tnum ml-1.5",
                    active ? "opacity-70" : "opacity-60",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!player ? (
        <EmptyState
          title="No village data"
          body="Sync your player tag to load troops, heroes, pets and equipment."
          action={
            <Button onClick={sync} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          }
        />
      ) : sections.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          body={
            query
              ? `No unit called “${query}” in the ${baseLabel}.`
              : `Nothing is ${filter === "maxed" ? "maxed" : filter === "locked" ? "locked" : "mid-upgrade"} here.`
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-10 pt-2">
          {sections.map((section) => (
            <section key={section.key} className="flex flex-col gap-5">
              <SectionHead
                id={section.key}
                title={section.label}
                meta={
                  section.summary.total
                    ? `${section.summary.maxed}/${section.summary.total} maxed${
                        section.summary.remaining
                          ? ` · ${section.summary.remaining} levels left`
                          : ""
                      }`
                    : undefined
                }
                right={
                  <div className="flex w-36 items-center gap-2">
                    <Meter
                      value={section.summary.progress}
                      solid={section.summary.maxedShare}
                      className="flex-1"
                    />
                    <span className="tnum w-9 text-right text-xs font-medium">
                      {Math.round(section.summary.progress * 100)}%
                    </span>
                  </div>
                }
              />
              <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-5 lg:grid-cols-6">
                {section.units.map((u) => (
                  <Unit key={`${section.key}-${u.name}`} unit={u} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
