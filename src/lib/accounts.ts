import type { TrackedAccount } from "@/types";
import { normalizeTag } from "@/lib/roster";

export function pickActiveAccount(
  accounts: TrackedAccount[],
  activeTag: string | null,
): TrackedAccount | null {
  if (!accounts.length) return null;
  if (!activeTag) return accounts[0];
  const wanted = normalizeTag(activeTag);
  return (
    accounts.find((a) => normalizeTag(a.playerTag) === wanted) ?? accounts[0]
  );
}

export function sortAccounts(accounts: TrackedAccount[]): TrackedAccount[] {
  return [...accounts].sort((a, b) => a.createdAt - b.createdAt);
}
