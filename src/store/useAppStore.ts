import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeTag } from "@/lib/roster";

export type BaseTab = "home" | "builder" | "capital";
export type SyncStatus = "idle" | "syncing" | "error";

interface AppState {
  playerTag: string | null;
  activeBase: BaseTab;
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  lastError: string | null;

  setPlayerTag: (tag: string | null) => void;
  setActiveBase: (base: BaseTab) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncAt: (ts: number) => void;
  setLastError: (err: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      playerTag: null,
      activeBase: "home",
      syncStatus: "idle",
      lastSyncAt: null,
      lastError: null,

      setPlayerTag: (playerTag) =>
        set({ playerTag: playerTag ? normalizeTag(playerTag) : null }),
      setActiveBase: (activeBase) => set({ activeBase }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      setLastError: (lastError) => set({ lastError }),
      reset: () =>
        set({
          playerTag: null,
          syncStatus: "idle",
          lastSyncAt: null,
          lastError: null,
        }),
    }),
    {
      name: "coc-tracker",
      partialize: (s) => ({
        playerTag: s.playerTag,
        activeBase: s.activeBase,
      }),
    },
  ),
);
