import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeTag } from "@/lib/roster";

export type BaseTab = "home" | "builder" | "capital";
export type SyncStatus = "idle" | "syncing" | "error";

export interface Account {
  tag: string;
  name: string;
}

interface AppState {
  playerTag: string | null;
  accounts: Account[];
  activeBase: BaseTab;
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  lastError: string | null;

  setPlayerTag: (tag: string | null) => void;
  addAccount: (tag: string, name: string) => void;
  switchAccount: (tag: string) => void;
  removeAccount: (tag: string) => void;
  setActiveBase: (base: BaseTab) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncAt: (ts: number) => void;
  setLastError: (err: string | null) => void;
  reset: () => void;
}

const CLEAN = { syncStatus: "idle" as SyncStatus, lastError: null };

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      playerTag: null,
      accounts: [],
      activeBase: "home",
      syncStatus: "idle",
      lastSyncAt: null,
      lastError: null,

      setPlayerTag: (playerTag) =>
        set({ playerTag: playerTag ? normalizeTag(playerTag) : null }),

      addAccount: (rawTag, name) => {
        const tag = normalizeTag(rawTag);
        const others = get().accounts.filter((a) => a.tag !== tag);
        set({
          accounts: [...others, { tag, name }],
          playerTag: tag,
          ...CLEAN,
        });
      },

      switchAccount: (rawTag) => {
        const tag = normalizeTag(rawTag);
        if (tag === get().playerTag) return;
        set({ playerTag: tag, lastSyncAt: null, ...CLEAN });
      },

      removeAccount: (rawTag) => {
        const tag = normalizeTag(rawTag);
        const accounts = get().accounts.filter((a) => a.tag !== tag);
        const wasActive = get().playerTag === tag;
        set({
          accounts,
          playerTag: wasActive ? (accounts[0]?.tag ?? null) : get().playerTag,
          ...(wasActive ? { lastSyncAt: null, ...CLEAN } : {}),
        });
      },

      setActiveBase: (activeBase) => set({ activeBase }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      setLastError: (lastError) => set({ lastError }),
      reset: () => {
        const tag = get().playerTag;
        if (tag) return get().removeAccount(tag);
        set({ playerTag: null, lastSyncAt: null, ...CLEAN });
      },
    }),
    {
      name: "coc-tracker",
      version: 2,
      migrate: (state) => {
        const old = state as Partial<AppState>;
        if (old?.playerTag && !old.accounts?.length) {
          old.accounts = [{ tag: old.playerTag, name: `#${old.playerTag}` }];
        }
        return old as AppState;
      },
      partialize: (s) => ({
        playerTag: s.playerTag,
        accounts: s.accounts,
        activeBase: s.activeBase,
      }),
    },
  ),
);
