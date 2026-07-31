import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import {
  ArrowLeftRight,
  BadgeCheck,
  Check,
  Loader2,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagForm } from "@/components/TagForm";
import { ErrorNote } from "@/components/ui/bits";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { useAccounts } from "@/hooks/useAccounts";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { VerifyResult } from "@/types";

export function AccountsPage() {
  const { accounts, playerTag, loading } = useAccounts();
  const setActiveTag = useAppStore((s) => s.setActiveTag);
  const unlink = useMutation(api.accounts.unlink);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const forget = async (tag: string) => {
    setError(null);
    try {
      await unlink({ playerTag: tag });
      if (tag === playerTag) setActiveTag(null);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <div className="flex flex-col gap-10 py-2">
      <header className="flex flex-col gap-3">
        <Shield className="text-primary h-7 w-7" />
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground text-sm">
          Villages linked to your Clashboard sign-in. Track as many as you like
          and switch between them in one click.
        </p>
      </header>

      {error ? <ErrorNote message={error} /> : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : accounts.length ? (
        <section className="flex flex-col gap-1">
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {accounts.length === 1 ? "Tracked account" : "Your accounts"}
          </p>
          <div className="flex flex-col">
            {accounts.map((account) => {
              const active = account.playerTag === playerTag;
              return (
                <div
                  key={account.playerTag}
                  className="border-hairline flex flex-col gap-3 border-b py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTag(account.playerTag)}
                      disabled={active}
                      className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={cn(
                          "h-7 w-[3px] shrink-0 rounded-full transition-colors",
                          active ? "bg-primary" : "bg-foreground/10",
                        )}
                      />
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 truncate text-sm font-semibold transition-colors",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {account.name}
                          {account.verifiedAt ? (
                            <BadgeCheck className="text-success h-3.5 w-3.5 shrink-0" />
                          ) : null}
                        </span>
                        <span className="text-muted-foreground tnum block truncate text-xs">
                          #{account.playerTag}
                          {account.verifiedAt ? " · verified owner" : ""}
                        </span>
                      </span>
                    </button>

                    {active ? (
                      <span className="text-primary flex items-center gap-1.5 text-xs font-medium">
                        <Check className="h-3.5 w-3.5" />
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTag(account.playerTag)}
                        className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Switch
                      </button>
                    )}

                    {account.verifiedAt ? null : (
                      <button
                        type="button"
                        onClick={() =>
                          setVerifying(
                            verifying === account.playerTag
                              ? null
                              : account.playerTag,
                          )
                        }
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verify
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => forget(account.playerTag)}
                      aria-label={`Remove ${account.name}`}
                      className="text-muted-foreground/60 hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {verifying === account.playerTag ? (
                    <VerifyForm
                      tag={account.playerTag}
                      onDone={() => setVerifying(null)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Switching is instant — each account keeps its own synced village and
            battle log. Removing one unlinks it from your sign-in. Verifying
            proves the village is yours using the one-time API token from the
            game.
          </p>
        </section>
      ) : null}

      <TagForm
        label={accounts.length ? "Add another player tag" : "Player tag"}
        submitLabel={accounts.length ? "Add account" : "Start tracking"}
        redirectTo={accounts.length ? undefined : "/overview"}
      />
    </div>
  );
}

function VerifyForm({ tag, onDone }: { tag: string; onDone: () => void }) {
  const verifyOwnership = useAction(api.players.verify.verifyOwnership);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return setError("Paste the token from the game first.");
    setBusy(true);
    setError(null);
    try {
      const result: VerifyResult = await verifyOwnership({
        playerTag: tag,
        token,
      });
      if (!result.ok) {
        setError(friendlyError(result.error));
        return;
      }
      if (!result.verified) {
        setError(
          "The game rejected that token. Tokens are single use and expire quickly — generate a fresh one and try again.",
        );
        return;
      }
      onDone();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border-hairline ml-[15px] flex flex-col gap-3 border-l pl-4"
    >
      <p className="text-muted-foreground text-xs">
        In game: Settings → More Settings → API Token. The token is single use
        and expires within minutes.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={token}
          spellCheck={false}
          onChange={(e) => setToken(e.target.value)}
          placeholder="abc123..."
          aria-label={`API token for ${tag}`}
          className="border-hairline focus:border-primary placeholder:text-muted-foreground/40 min-w-0 flex-1 border-b bg-transparent pb-1.5 font-mono text-sm transition-colors outline-none"
        />
        <Button type="submit" size="sm" disabled={busy || !token.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          {busy ? "Checking…" : "Verify ownership"}
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
      {error ? <ErrorNote message={error} /> : null}
    </form>
  );
}
