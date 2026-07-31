import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { useAppStore } from "@/store/useAppStore";
import { friendlyError } from "@/lib/errors";

export function useSync() {
  const playerTag = useAppStore((s) => s.playerTag);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const lastError = useAppStore((s) => s.lastError);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setLastSyncAt = useAppStore((s) => s.setLastSyncAt);
  const setLastError = useAppStore((s) => s.setLastError);

  const requestRefresh = useAction(api.players.sync.requestRefresh);
  const syncBattleLog = useAction(api.battles.sync.syncBattleLog);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (!playerTag || syncing) return;
    setSyncing(true);
    setSyncStatus("syncing");
    try {
      const [player, battles] = await Promise.all([
        requestRefresh({ playerTag }),
        syncBattleLog({ playerTag }),
      ]);
      const error = !player.ok
        ? friendlyError(player.error)
        : !battles.ok
          ? `Battle log: ${friendlyError(battles.error)}`
          : null;
      setLastSyncAt(player.ok ? player.fetchedAt : Date.now());
      setLastError(error);
      setSyncStatus(error ? "error" : "idle");
    } catch (err) {
      setLastError(friendlyError(err));
      setSyncStatus("error");
    } finally {
      setSyncing(false);
    }
  }, [
    playerTag,
    syncing,
    requestRefresh,
    syncBattleLog,
    setSyncStatus,
    setLastSyncAt,
    setLastError,
  ]);

  return { sync, syncing, syncStatus, lastError };
}
