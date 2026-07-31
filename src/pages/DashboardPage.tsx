import { useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { RefreshCw, Swords, Trophy, Home as HomeIcon } from "lucide-react";
import { useState } from "react";
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
import { usePlayerData } from "@/hooks/usePlayerData";
import { overallProgress } from "@/lib/roster";
import { useAppStore } from "@/store/useAppStore";
import { Link } from "@tanstack/react-router";

export function DashboardPage() {
  const playerTag = useAppStore((s) => s.playerTag);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setLastSyncAt = useAppStore((s) => s.setLastSyncAt);
  const setLastError = useAppStore((s) => s.setLastError);

  const requestRefresh = useAction(api.players.sync.requestRefresh);
  const { player, loading } = usePlayerData(playerTag ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!playerTag) return;
    setRefreshing(true);
    setSyncStatus("syncing");
    try {
      const result = await requestRefresh({ playerTag });
      if (result.ok) {
        setLastSyncAt(result.fetchedAt);
        setLastError(null);
        setSyncStatus("idle");
      } else {
        setLastError(result.error);
        setSyncStatus("error");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Refresh failed";
      setLastError(message);
      setSyncStatus("error");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!player) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No player data yet</CardTitle>
          <CardDescription>
            Head to Setup and enter your player tag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/setup">Go to setup</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const troopProgress = overallProgress(player.troops);
  const spellProgress = overallProgress(player.spells);
  const heroProgress = overallProgress(player.heroes);
  const PET_NAMES = new Set([
    "L.A.S.S.I",
    "Mighty Yak",
    "Electro Owl",
    "Unicorn",
    "Phoenix",
    "Poison Lizard",
    "Diggy",
    "Frosty",
    "Spirit Fox",
    "Angry Jelly",
    "Sneezy",
    "Greedy Raven",
  ]);
  const petProgress = overallProgress(
    player.troops.filter((t) => PET_NAMES.has(t.name)),
  );

  const categories: { label: string; value: number; to: string }[] = [
    { label: "Troops", value: troopProgress, to: "/roster" },
    { label: "Spells", value: spellProgress, to: "/roster" },
    { label: "Heroes", value: heroProgress, to: "/roster" },
    { label: "Pets", value: petProgress, to: "/roster" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{player.name}</h1>
          <p className="text-muted-foreground text-sm">
            {player.playerTag}
            {player.clanName ? ` · ${player.clanName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus === "syncing" ? (
            <Badge variant="secondary">
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Syncing
            </Badge>
          ) : syncStatus === "error" ? (
            <Badge variant="destructive">Sync error</Badge>
          ) : (
            <Badge variant="outline">Live</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || !playerTag}
          >
            <RefreshCw
              className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Swords className="text-primary h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">Town Hall</p>
              <p className="text-2xl font-bold">{player.townHallLevel}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Trophy className="text-primary h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">Trophies</p>
              <p className="text-2xl font-bold">{player.trophies}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Trophy className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-muted-foreground text-sm">War stars</p>
              <p className="text-2xl font-bold">
                {player.warStars?.toLocaleString() ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <HomeIcon className="text-primary h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">Exp level</p>
              <p className="text-2xl font-bold">{player.expLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Donations</p>
          <p className="text-lg font-semibold">
            {player.donations?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Capital gold</p>
          <p className="text-lg font-semibold">
            {player.clanCapitalContributions?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Builder trophies</p>
          <p className="text-lg font-semibold">
            {player.builderBaseTrophies?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Last sync</p>
          <p className="text-lg font-semibold">
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleTimeString()
              : new Date(player.lastFetchedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            Share of total levels unlocked across each category.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {categories.map((c) => (
            <div key={c.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">
                  {Math.round(c.value * 100)}%
                </span>
              </div>
              <Progress value={c.value * 100} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link to="/roster">View full roster</Link>
        </Button>
      </div>
    </div>
  );
}
