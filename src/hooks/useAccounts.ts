import { useEffect } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "convex/_generated/api";
import { useAppStore } from "@/store/useAppStore";
import type { TrackedAccount } from "@/types";
import { pickActiveAccount } from "@/lib/accounts";

export function useEnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (!isAuthenticated) return;
    void ensureUser({
      name: user?.fullName ?? user?.username ?? undefined,
      email: user?.primaryEmailAddress?.emailAddress ?? undefined,
    });
  }, [isAuthenticated, user, ensureUser]);
}

export function useAccounts() {
  const { isAuthenticated } = useConvexAuth();
  const accounts = useQuery(api.accounts.list, isAuthenticated ? {} : "skip");
  const activeTag = useAppStore((s) => s.activeTag);
  const setActiveTag = useAppStore((s) => s.setActiveTag);

  const list = (accounts ?? []) as TrackedAccount[];
  const active = pickActiveAccount(list, activeTag);

  useEffect(() => {
    if (!accounts) return;
    if (active && active.playerTag !== activeTag) {
      setActiveTag(active.playerTag);
    }
    if (!active && activeTag) setActiveTag(null);
  }, [accounts, active, activeTag, setActiveTag]);

  return {
    accounts: list,
    active,
    playerTag: active?.playerTag ?? null,
    loading: isAuthenticated && accounts === undefined,
  };
}
