import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { RefreshCw, Star, Swords, Shield, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBattleLog } from "@/hooks/usePlayerData";
import { useAppStore } from "@/store/useAppStore";

const LOOT_ORDER = ["Gold", "Elixir", "DarkElixir"];

function formatLoot(
  loot: { name: string; amount: number }[] | undefined,
): string {
  if (!loot?.length) return "—";
  const byName = new Map(loot.map((r) => [r.name, r.amount] as const));
  const parts: string[] = [];
  for (const name of LOOT_ORDER) {
    const amount = byName.get(name);
    if (amount) {
      parts.push(`${amount.toLocaleString()} ${name}`);
    }
  }
  return parts.length ? parts.join(" · ") : "—";
}

function parseBattleTimestamp(ts: string): Date {
  const match = ts.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return new Date(ts);
  const [, y, mo, d, h, mi, s] = match.map(Number);
  return new Date(y, mo - 1, d, h, mi, s);
}

function BattleCard({
  battle,
}: {
  battle: {
    battleType: string;
    attack: boolean;
    opponentPlayerTag: string;
    opponentName: string;
    opponentTownHallLevel?: number;
    stars: number;
    destructionPercentage: number;
    lootedResources?: { name: string; amount: number }[];
    extraLootedResources?: { name: string; amount: number }[];
    battleTime?: number;
    battleTimestamp: string;
  };
}) {
  const date = parseBattleTimestamp(battle.battleTimestamp);
  const isAttack = battle.attack;
  const won = battle.stars >= 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant={isAttack ? "default" : "secondary"} className="gap-1">
            {isAttack ? (
              <Swords className="h-3 w-3" />
            ) : (
              <Shield className="h-3 w-3" />
            )}
            {isAttack ? "Attack" : "Defense"}
          </Badge>
          <Badge variant="outline">{battle.battleType}</Badge>
          <Badge variant={won ? "default" : "destructive"} className="gap-1">
            <Trophy className="h-3 w-3" />
            {won ? "Win" : "Loss"}
          </Badge>
        </div>
        <span className="text-muted-foreground text-xs">
          {date.toLocaleString()}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium">{battle.opponentName}</p>
            <p className="text-muted-foreground text-xs">
              {battle.opponentPlayerTag}
              {battle.opponentTownHallLevel
                ? ` · TH ${battle.opponentTownHallLevel}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < battle.stars
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Destruction</span>
            <span className="font-medium">{battle.destructionPercentage}%</span>
          </div>
          <Progress value={battle.destructionPercentage} className="h-1.5" />
        </div>

        <div className="grid gap-1 text-xs sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Looted: </span>
            <span className="font-medium">
              {formatLoot(battle.lootedResources)}
            </span>
          </div>
          {battle.battleTime ? (
            <div>
              <span className="text-muted-foreground">Duration: </span>
              <span className="font-medium">
                {Math.floor(battle.battleTime / 60)}:
                {String(battle.battleTime % 60).padStart(2, "0")}
              </span>
            </div>
          ) : null}
        </div>

        {battle.extraLootedResources?.length ? (
          <p className="text-muted-foreground text-xs">
            Bonus: {formatLoot(battle.extraLootedResources)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function BattlesPage() {
  const playerTag = useAppStore((s) => s.playerTag);
  const syncBattleLog = useAction(api.battles.sync.syncBattleLog);
  const { items, loading } = useBattleLog(playerTag ?? "");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (!playerTag) return;
    setRefreshing(true);
    setError(null);
    try {
      const result = await syncBattleLog({ playerTag });
      if (!result.ok) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const attackCount = items.filter((b) => b.attack).length;
  const defenseCount = items.length - attackCount;
  const winCount = items.filter((b) => b.stars >= 1).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Battle Log</h1>
          <p className="text-muted-foreground text-sm">
            Recent attacks and defenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error ? <Badge variant="destructive">{error}</Badge> : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || !playerTag}
          >
            <RefreshCw
              className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            {refreshing ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No battles yet</CardTitle>
            <CardDescription>
              Hit Refresh to pull the latest battle log.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-muted-foreground text-xs">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{attackCount}</p>
                <p className="text-muted-foreground text-xs">Attacks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">
                  {winCount}/{items.length}
                </p>
                <p className="text-muted-foreground text-xs">Wins</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((battle) => (
              <BattleCard key={battle.battleTimestamp} battle={battle} />
            ))}
          </div>
        </>
      )}

      {!loading && items.length > 0 ? (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground text-xs">
                {defenseCount} defense
                {defenseCount === 1 ? "" : "s"} shown
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {attackCount} attacks · {defenseCount} defenses
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
}
