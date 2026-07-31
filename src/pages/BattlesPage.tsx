import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Shield,
  Star,
  Swords,
} from "lucide-react";
import { EmptyState, ErrorNote, Meter, Stat } from "@/components/ui/bits";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBattleLog, type BattleEntry } from "@/hooks/usePlayerData";
import { useSync } from "@/hooks/useSync";
import { useAppStore } from "@/store/useAppStore";
import { parseArmy, armyLink, type Army } from "@/lib/army";
import { cn, compact, parseBattleTimestamp, relativeTime } from "@/lib/utils";

type Filter = "all" | "attack" | "defense" | "ranked";

const LOOT_ORDER = ["Gold", "Elixir", "DarkElixir"] as const;
const LOOT_LABEL: Record<string, string> = {
  Gold: "gold",
  Elixir: "elixir",
  DarkElixir: "dark",
};

const MODE_LABEL: Record<string, string> = {
  homeVillage: "Multiplayer",
  ranked: "Ranked",
  clanWar: "Clan War",
  clanGames: "Clan Games",
  builderBase: "Builder Base",
  versusBattle: "Builder Base",
  clanCapital: "Clan Capital",
  friendly: "Friendly Challenge",
};

function modeLabel(type: string): string {
  return (
    MODE_LABEL[type] ??
    type
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase())
  );
}

function loot(resources: { name: string; amount: number }[] | undefined) {
  if (!resources?.length) return null;
  const byName = new Map(resources.map((r) => [r.name, r.amount] as const));
  const parts = LOOT_ORDER.map((name) => ({
    name,
    amount: byName.get(name) ?? 0,
  }))
    .filter((r) => r.amount > 0)
    .map((r) => `${compact(r.amount)} ${LOOT_LABEL[r.name]}`);
  return parts.length ? parts.join(" · ") : null;
}

function UnitIcon({
  name,
  image,
  count,
  className,
  imgClassName,
}: {
  name: string;
  image: string;
  count?: number;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span
      className={cn(
        "bg-foreground/[0.05] relative flex shrink-0 items-center justify-center rounded-lg",
        className,
      )}
      title={count && count > 1 ? `${count}× ${name}` : name}
    >
      <img
        src={`/${image}`}
        alt={name}
        loading="lazy"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        className={cn("object-contain", imgClassName)}
      />
      {count && count > 1 ? (
        <span className="bg-primary text-primary-foreground tnum absolute -right-1 -bottom-1 rounded-full px-1 text-[10px] leading-4 font-bold">
          {count}
        </span>
      ) : null}
    </span>
  );
}

function UnitChip({
  name,
  image,
  count,
}: {
  name: string;
  image: string;
  count?: number;
}) {
  return (
    <div className="flex w-[68px] flex-col items-center gap-1.5">
      <UnitIcon
        name={name}
        image={image}
        count={count}
        className="h-12 w-12"
        imgClassName="h-9 w-9"
      />
      <span className="text-muted-foreground line-clamp-2 text-center text-[10px] leading-tight">
        {name}
      </span>
    </div>
  );
}

function ArmyPanel({
  army,
  code,
  mine,
}: {
  army: Army;
  code: string;
  mine: boolean;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(armyLink(code));
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 2500);
  };

  return (
    <div className="border-hairline mt-1 mb-4 flex flex-col gap-5 border-l-2 py-4 pl-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {mine ? "Army you attacked with" : "Army used against you"}
          {army.housing ? (
            <span className="tnum"> · {army.housing} housing space</span>
          ) : null}
          {army.unknown ? (
            <span className="tnum">
              {" "}
              · {army.unknown} unit(s) newer than our data
            </span>
          ) : null}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
              copied === "fail"
                ? "text-destructive"
                : copied === "ok"
                  ? "text-success"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {copied === "ok" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied === "ok"
              ? "Link copied"
              : copied === "fail"
                ? "Copy blocked — use Open in game"
                : "Copy army link"}
          </button>
          <a
            href={armyLink(code)}
            target="_blank"
            rel="noreferrer"
            className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in game
          </a>
        </div>
      </div>

      {army.heroes.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
            Heroes
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {army.heroes.map((h) => (
              <div
                key={h.id}
                className="border-hairline flex items-center gap-3 rounded-lg border p-2.5"
              >
                <UnitIcon
                  name={h.name}
                  image={h.image}
                  className="h-12 w-12"
                  imgClassName="h-10 w-10"
                />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="truncate text-xs font-semibold">{h.name}</p>
                  <div className="flex items-center gap-1.5">
                    {h.pet ? (
                      <UnitIcon
                        name={h.pet.name}
                        image={h.pet.image}
                        className="ring-info/40 h-7 w-7 rounded-md ring-1"
                        imgClassName="h-5 w-5"
                      />
                    ) : null}
                    {h.equipment.map((e) => (
                      <UnitIcon
                        key={e.name}
                        name={e.name}
                        image={e.image}
                        className="h-7 w-7 rounded-md"
                        imgClassName="h-5 w-5"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground truncate text-[10px]">
                    {[h.pet?.name, ...h.equipment.map((e) => e.name)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {army.troops.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
            Troops
          </p>
          <div className="flex flex-wrap gap-3">
            {army.troops.map((t) => (
              <UnitChip key={t.id} {...t} />
            ))}
          </div>
        </div>
      ) : null}

      {army.spells.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
            Spells
          </p>
          <div className="flex flex-wrap gap-3">
            {army.spells.map((s) => (
              <UnitChip key={s.id} {...s} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BattleRow({ battle }: { battle: BattleEntry }) {
  const [open, setOpen] = useState(false);
  const army = useMemo(
    () => parseArmy(battle.armyShareCode),
    [battle.armyShareCode],
  );

  const date = parseBattleTimestamp(battle.battleTimestamp);
  const isAttack = battle.attack;
  const looted = loot(battle.lootedResources);
  const bonus = loot(battle.extraLootedResources);
  const held = !isAttack && battle.stars === 0;

  return (
    <div className="border-hairline border-b">
      <div
        className={cn(
          "grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 py-4 transition-colors sm:grid-cols-[104px_1fr_130px_auto_auto]",
          army && "hover:bg-foreground/[0.02] cursor-pointer",
        )}
        onClick={army ? () => setOpen((v) => !v) : undefined}
      >
        <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold",
              isAttack ? "text-primary" : held ? "text-success" : "text-info",
            )}
          >
            {isAttack ? (
              <Swords className="h-3.5 w-3.5" />
            ) : (
              <Shield className="h-3.5 w-3.5" />
            )}
            {isAttack ? "Attack" : held ? "Defense held" : "Defense"}
          </span>
          <span className="text-muted-foreground text-[11px]">
            {relativeTime(date.getTime())}
          </span>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            {battle.opponentName}
            {battle.opponentTownHallLevel ? (
              <span className="text-muted-foreground tnum font-normal">
                TH{battle.opponentTownHallLevel}
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-medium",
                battle.battleType === "ranked"
                  ? "bg-primary/15 text-primary"
                  : "bg-foreground/[0.06] text-muted-foreground",
              )}
            >
              {modeLabel(battle.battleType)}
            </span>
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {battle.opponentPlayerTag}
            {looted
              ? ` · ${isAttack ? "took" : "lost"} ${looted}`
              : " · no loot"}
            {bonus ? ` · +${bonus} bonus` : ""}
            {battle.battleTime
              ? ` · ${Math.floor(battle.battleTime / 60)}:${String(
                  battle.battleTime % 60,
                ).padStart(2, "0")}`
              : ""}
          </p>
        </div>

        <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
          <Meter
            value={battle.destructionPercentage / 100}
            tone={battle.destructionPercentage >= 100 ? "success" : "gold"}
            className="flex-1"
          />
          <span className="tnum w-10 text-right text-xs font-medium">
            {battle.destructionPercentage}%
          </span>
        </div>

        <div className="flex items-center justify-end gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < battle.stars
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/25",
              )}
            />
          ))}
        </div>

        <span className="hidden sm:block">
          {army ? (
            <ChevronDown
              className={cn(
                "text-muted-foreground/50 h-4 w-4 transition-transform",
                open && "rotate-180",
              )}
            />
          ) : (
            <span className="block w-4" />
          )}
        </span>
      </div>

      {open && army ? (
        <ArmyPanel
          army={army}
          code={battle.armyShareCode!}
          mine={battle.attack}
        />
      ) : null}
    </div>
  );
}

export function BattlesPage() {
  const playerTag = useAppStore((s) => s.playerTag);
  const { items, fetchedAt, loading } = useBattleLog(playerTag ?? "");
  const { sync, syncing, lastError } = useSync();
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const attacks = items.filter((b) => b.attack);
    const defenses = items.filter((b) => !b.attack);
    const ranked = items.filter((b) => b.battleType === "ranked");
    const attackWins = attacks.filter((b) => b.stars >= 1).length;
    const threeStars = attacks.filter((b) => b.stars === 3).length;
    const held = defenses.filter((b) => b.stars === 0).length;
    const armies = items.filter((b) => b.armyShareCode).length;
    const avgDestruction = attacks.length
      ? Math.round(
          attacks.reduce((a, b) => a + b.destructionPercentage, 0) /
            attacks.length,
        )
      : 0;
    return {
      attacks,
      defenses,
      ranked,
      attackWins,
      threeStars,
      held,
      armies,
      avgDestruction,
    };
  }, [items]);

  const FILTERS: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: items.length },
    { value: "attack", label: "Attacks", count: stats.attacks.length },
    { value: "defense", label: "Defenses", count: stats.defenses.length },
    { value: "ranked", label: "Ranked", count: stats.ranked.length },
  ];

  const shown =
    filter === "all"
      ? items
      : filter === "attack"
        ? stats.attacks
        : filter === "defense"
          ? stats.defenses
          : stats.ranked;

  return (
    <div className="flex flex-col gap-8">
      {lastError && (
        <ErrorNote message={lastError} onRetry={sync} retrying={syncing} />
      )}

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Battle log</h1>
        <p className="text-muted-foreground text-sm">
          Attacks and defenses the Clash API still remembers · updated{" "}
          {relativeTime(fetchedAt)}
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-14 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Swords className="h-8 w-8" />}
          title="No battles recorded"
          body="The Clash API keeps only a short battle log and it has to be pulled while it is fresh. Sync now to capture it."
          action={
            <Button onClick={sync} disabled={syncing}>
              {syncing ? "Syncing…" : "Pull battle log"}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            <Stat
              label="Attack wins"
              value={`${stats.attackWins}/${stats.attacks.length}`}
              hint={`${stats.threeStars} three-star`}
              tone="gold"
            />
            <Stat
              label="Avg destruction"
              value={`${stats.avgDestruction}%`}
              hint="on attacks"
            />
            <Stat
              label="Defenses held"
              value={`${stats.held}/${stats.defenses.length}`}
              hint="opponent got zero stars"
            />
            <Stat
              label="Armies decoded"
              value={stats.armies}
              hint="tap a row to open"
            />
          </div>

          <div className="border-hairline flex flex-wrap items-center gap-1.5 border-b pb-3">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                )}
              >
                {f.label}
                <span className="tnum ml-1.5 opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState
              title="Nothing in this filter"
              body={
                filter === "ranked"
                  ? "No ranked battles in the current log."
                  : `No ${filter === "attack" ? "attacks" : "defenses"} in the current log.`
              }
              action={
                <Button variant="outline" onClick={() => setFilter("all")}>
                  Show everything
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col">
              {shown.map((b) => (
                <BattleRow key={b.battleTimestamp} battle={b} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
