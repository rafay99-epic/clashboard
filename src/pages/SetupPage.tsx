import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "convex/_generated/api";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/bits";
import { useAppStore } from "@/store/useAppStore";
import { normalizeTag } from "@/lib/roster";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

const TAG_PATTERN = /^[0289PYLQGRJCUV]{3,12}$/;

export function SetupPage() {
  const navigate = useNavigate();
  const syncPlayer = useAction(api.players.sync.syncPlayer);

  const currentTag = useAppStore((s) => s.playerTag);
  const accounts = useAppStore((s) => s.accounts);
  const addAccount = useAppStore((s) => s.addAccount);
  const switchAccount = useAppStore((s) => s.switchAccount);
  const removeAccount = useAppStore((s) => s.removeAccount);
  const markVerified = useAppStore((s) => s.markVerified);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setLastSyncAt = useAppStore((s) => s.setLastSyncAt);
  const setLastError = useAppStore((s) => s.setLastError);

  const [verifying, setVerifying] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeTag(input);
  const invalid = input.length > 0 && !TAG_PATTERN.test(normalized);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalized) return setError("Enter your player tag.");
    if (!TAG_PATTERN.test(normalized)) {
      return setError(
        "That does not look like a player tag. Example: #20Q09Y0JU",
      );
    }

    setSaving(true);
    setError(null);
    setSyncStatus("syncing");
    try {
      const result = await syncPlayer({ playerTag: normalized });
      if (!result.ok) {
        const message = friendlyError(result.error);
        setError(message);
        setSyncStatus("error");
        setLastError(message);
        return;
      }
      addAccount(normalized, result.name);
      setLastSyncAt(result.fetchedAt);
      setLastError(null);
      setSyncStatus("idle");
      await navigate({ to: "/" });
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
      setSyncStatus("error");
      setLastError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-3">
        <Shield className="text-primary h-7 w-7" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {currentTag ? "Accounts" : "Track your village"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {currentTag
            ? "Track as many villages as you like and switch between them in one click."
            : "Enter your Clash of Clans player tag. No API key needed, the backend holds the credentials."}
        </p>
      </header>

      {accounts.length ? (
        <section className="flex flex-col gap-1">
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {accounts.length === 1 ? "Tracked account" : "Your accounts"}
          </p>
          <div className="flex flex-col">
            {accounts.map((account) => {
              const active = account.tag === currentTag;
              return (
                <div
                  key={account.tag}
                  className="border-hairline flex flex-col gap-3 border-b py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => switchAccount(account.tag)}
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
                          #{account.tag}
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
                        onClick={() => switchAccount(account.tag)}
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
                            verifying === account.tag ? null : account.tag,
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
                      onClick={() => removeAccount(account.tag)}
                      aria-label={`Remove ${account.name}`}
                      className="text-muted-foreground/60 hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {verifying === account.tag ? (
                    <VerifyForm
                      tag={account.tag}
                      onVerified={(at) => {
                        markVerified(account.tag, at);
                        setVerifying(null);
                      }}
                      onCancel={() => setVerifying(null)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Switching is instant — each account keeps its own synced village and
            battle log. Removing one only forgets it on this device. Verifying
            proves the village is yours using the one-time API token from the
            game.
          </p>
        </section>
      ) : null}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="playerTag"
            className="text-muted-foreground text-[11px] tracking-wide uppercase"
          >
            {currentTag ? "Add another player tag" : "Player tag"}
          </label>
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground text-2xl">#</span>
            <input
              id="playerTag"
              value={input}
              autoFocus
              spellCheck={false}
              autoCapitalize="characters"
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder={currentTag ?? "20Q09Y0JU"}
              aria-invalid={invalid}
              className={cnInput(invalid)}
            />
          </div>
          <p
            className={
              invalid
                ? "text-destructive text-xs"
                : "text-muted-foreground text-xs"
            }
          >
            {invalid
              ? "Tags only contain 0 2 8 9 P Y L Q G R J C U V."
              : "In game: Settings → My Account → your tag is under your name."}
          </p>
        </div>

        {error ? <ErrorNote message={error} /> : null}

        <div>
          <Button type="submit" disabled={saving || !input || invalid}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                Fetching village…
              </>
            ) : (
              <>
                {currentTag ? "Add account" : "Start tracking"}
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function cnInput(invalid: boolean) {
  return [
    "tnum w-full border-b bg-transparent pb-2 text-2xl font-semibold tracking-wide outline-none placeholder:text-muted-foreground/40",
    invalid
      ? "border-destructive"
      : "border-hairline focus:border-primary transition-colors",
  ].join(" ");
}

function VerifyForm({
  tag,
  onVerified,
  onCancel,
}: {
  tag: string;
  onVerified: (verifiedAt: number) => void;
  onCancel: () => void;
}) {
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
      const result = await verifyOwnership({ playerTag: tag, token });
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
      onVerified(result.verifiedAt ?? Date.now());
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
          autoFocus
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
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
      {error ? <ErrorNote message={error} /> : null}
    </form>
  );
}
