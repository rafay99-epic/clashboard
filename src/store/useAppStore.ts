import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeTag } from "@/lib/roster";
import type { BaseTab, SyncStatus } from "@/types";

interface AppState {
  activeTag: string | null;
  activeBase: BaseTab;
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  lastError: string | null;

  setActiveTag: (tag: string | null) => void;
  setActiveBase: (base: BaseTab) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncAt: (ts: number | null) => void;
  setLastError: (err: string | null) => void;
  resetSession: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTag: null,
      activeBase: "home",
      syncStatus: "idle",
      lastSyncAt: null,
      lastError: null,

      setActiveTag: (tag) =>
        set({
          activeTag: tag ? normalizeTag(tag) : null,
          syncStatus: "idle",
          lastError: null,
        }),
      setActiveBase: (activeBase) => set({ activeBase }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      setLastError: (lastError) => set({ lastError }),
      resetSession: () =>
        set({
          activeTag: null,
          lastSyncAt: null,
          syncStatus: "idle",
          lastError: null,
        }),
    }),
    {
      name: "clashboard",
      version: 3,
      partialize: (s) => ({
        activeTag: s.activeTag,
        activeBase: s.activeBase,
      }),
    },
  ),
);
