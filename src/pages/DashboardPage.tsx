import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, Star } from "lucide-react";
import {
  EmptyState,
  ErrorNote,
  Meter,
  SectionHead,
  Stat,
} from "@/components/ui/bits";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePlayerData, useBattleLog } from "@/hooks/usePlayerData";
import { useSync } from "@/hooks/useSync";
import { useAccounts } from "@/hooks/useAccounts";
import { useAppStore } from "@/store/useAppStore";
import {
  buildRoster,
  summarize,
  CATEGORY_LABELS,
  INFO_ONLY,
  type RosterCategory,
} from "@/lib/roster";
import { compact, parseBattleTimestamp, relativeTime } from "@/lib/utils";
import { friendlyError } from "@/lib/errors";

const PROGRESS_CATEGORIES: RosterCategory[] = [
  "heroes",
  "equipment",
  "pets",
  "troops",
  "spells",
  "siege",
];

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

export function DashboardPage() {
  const { playerTag } = useAccounts();
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const { player, roster, loading } = usePlayerData(playerTag);
  const { items: battles } = useBattleLog(playerTag);
  const { sync, syncing, lastError } = useSync(playerTag);

  const categories = useMemo(() => {
    const grouped = buildRoster(player, roster, "home");
    return PROGRESS_CATEGORIES.filter((c) => !INFO_ONLY.has(c))
      .map((c) => ({
        key: c,
        label: CATEGORY_LABELS[c],
        ...summarize(grouped[c]),
      }))
      .filter((c) => c.total > 0);
  }, [player, roster]);

  if (loading) return <DashboardSkeleton />;

  if (!player) {
    return (
      <EmptyState
        title="Nothing synced yet"
        body="We have your tag but no village data. Pull it from the Clash of Clans API to get started."
        action={
          <Button onClick={sync} disabled={syncing}>
            {syncing ? "Syncing…" : "Sync my village"}
          </Button>
        }
      />
    );
  }

  const league = player.leagueIconUrls?.large ?? player.leagueIconUrls?.small;
  const recent = battles.slice(0, 5);
  const overall = categories.length
    ? categories.reduce((a, c) => a + c.progress, 0) / categories.length
    : 0;
  const staleFetch = player.lastFetchedAt > player.lastSuccessfulAt;
  const backendError = staleFetch ? player.lastError : undefined;
  const shownError = lastError ?? (backendError && friendlyError(backendError));

  return (
    <div className="flex flex-col gap-10">
      {shownError && (
        <ErrorNote message={shownError} onRetry={sync} retrying={syncing} />
      )}

      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-5">
          {league ? (
            <img
              src={league}
              alt={player.leagueName ?? "League"}
              className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(224,165,49,0.25)]"
            />
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-semibold tracking-tight">
              {player.name}
            </h1>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="tnum">#{player.playerTag}</span>
              {player.clanName ? (
                <span className="flex items-center gap-1.5">
                  {player.clanBadgeUrls?.small ? (
                    <img
                      src={player.clanBadgeUrls.small}
                      alt=""
                      className="h-4 w-4"
                    />
                  ) : null}
                  {player.clanName}
                </span>
              ) : (
                <span>No clan</span>
              )}
              {player.leagueName ? <span>{player.leagueName}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Town Hall
            </p>
            <p className="tnum text-primary text-4xl leading-none font-semibold">
              {player.townHallLevel}
            </p>
          </div>
          {player.builderHallLevel ? (
            <div className="border-hairline border-l pl-8 text-right">
              <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Builder Hall
              </p>
              <p className="tnum text-4xl leading-none font-semibold">
                {player.builderHallLevel}
              </p>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
        <Stat
          label="Trophies"
          value={player.trophies.toLocaleString()}
          hint={`Best ${player.bestTrophies.toLocaleString()}`}
          tone="gold"
        />
        <Stat
          label="War stars"
          value={compact(player.warStars)}
          hint={`Level ${player.expLevel}`}
        />
        <Stat
          label="Attack wins"
          value={player.attackWins.toLocaleString()}
          hint={`${player.defenseWins.toLocaleString()} defense wins`}
        />
        <Stat
          label="Donations"
          value={compact(player.donations)}
          hint={`${compact(player.donationsReceived)} received`}
        />
        <Stat
          label="Capital gold"
          value={compact(player.clanCapitalContributions)}
        />
        <Stat
          label="Builder trophies"
          value={compact(player.builderBaseTrophies)}
          hint={
            player.bestBuilderBaseTrophies
              ? `Best ${compact(player.bestBuilderBaseTrophies)}`
              : undefined
          }
        />
        <Stat
          label="Overall progress"
          value={`${Math.round(overall * 100)}%`}
          hint="Home village units"
        />
        <Stat
          label="Last sync"
          value={relativeTime(lastSyncAt ?? player.lastSuccessfulAt)}
          hint={new Date(player.lastFetchedAt).toLocaleTimeString()}
        />
      </div>

      <section className="flex flex-col gap-4">
        <SectionHead
          title="Upgrade progress"
          meta="home village"
          right={
            <Link
              to="/roster"
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs transition-colors"
            >
              Full roster
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground flex items-center gap-4 pb-1 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="bg-primary h-[6px] w-3 rounded-full" />
              maxed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-primary/35 h-[6px] w-3 rounded-full" />
              levels earned
            </span>
          </p>

          {categories.map((c) => (
            <Link
              key={c.key}
              to="/roster"
              hash={c.key}
              className="group border-hairline hover:bg-foreground/[0.02] -mx-3 flex flex-col gap-2 rounded-md border-b px-3 py-3.5 transition-colors last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="group-hover:text-primary text-sm font-medium transition-colors">
                  {c.label}
                </span>
                <span className="tnum text-base font-semibold">
                  {Math.round(c.progress * 100)}
                  <span className="text-muted-foreground text-xs">%</span>
                </span>
              </div>

              <Meter value={c.progress} solid={c.maxedShare} thick />

              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-[11px]">
                <span className="tnum">
                  <span className="text-foreground font-medium">{c.maxed}</span>
                  /{c.total} maxed
                </span>
                {c.locked > 0 ? (
                  <span className="tnum">· {c.locked} still locked</span>
                ) : null}
                <span className="tnum ml-auto">
                  {c.remaining === 0
                    ? "nothing left to upgrade"
                    : `${c.remaining.toLocaleString()} levels to go`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHead
          title="Recent battles"
          meta={battles.length ? `${battles.length} logged` : undefined}
          right={
            <Link
              to="/battles"
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs transition-colors"
            >
              All battles
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {recent.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">
            No battle log yet — sync to pull your last 25 attacks and defenses.
          </p>
        ) : (
          <div className="flex flex-col">
            {recent.map((b) => (
              <div
                key={b.battleTimestamp}
                className="border-hairline flex items-center gap-4 border-b py-3 text-sm last:border-b-0"
              >
                <span
                  className={`w-16 shrink-0 text-xs font-medium ${
                    b.attack ? "text-primary" : "text-info"
                  }`}
                >
                  {b.attack ? "Attack" : "Defense"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {b.opponentName}
                  {b.opponentTownHallLevel ? (
                    <span className="text-muted-foreground tnum">
                      {" "}
                      · TH{b.opponentTownHallLevel}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < b.stars
                          ? "fill-primary text-primary h-3.5 w-3.5"
                          : "text-muted-foreground/25 h-3.5 w-3.5"
                      }
                    />
                  ))}
                </span>
                <span className="tnum text-muted-foreground w-12 shrink-0 text-right text-xs">
                  {b.destructionPercentage}%
                </span>
                <span className="text-muted-foreground hidden w-20 shrink-0 text-right text-xs sm:block">
                  {relativeTime(
                    parseBattleTimestamp(b.battleTimestamp).getTime(),
                  )}
                </span>
                <ChevronRight className="text-muted-foreground/30 h-4 w-4 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
