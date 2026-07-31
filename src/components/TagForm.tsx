import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/bits";
import { useAppStore } from "@/store/useAppStore";
import { normalizeTag } from "@/lib/roster";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { SyncResult } from "@/types";

export const TAG_PATTERN = /^[0289PYLQGRJCUV]{3,12}$/;

export function TagForm({
  label,
  submitLabel,
  size = "md",
  redirectTo,
}: {
  label: string;
  submitLabel: string;
  size?: "md" | "lg";
  redirectTo?: string;
}) {
  const navigate = useNavigate();
  const syncPlayer = useAction(api.players.sync.syncPlayer);
  const setActiveTag = useAppStore((s) => s.setActiveTag);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setLastSyncAt = useAppStore((s) => s.setLastSyncAt);
  const setLastError = useAppStore((s) => s.setLastError);

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
      const result: SyncResult = await syncPlayer({ playerTag: normalized });
      if (!result.ok) {
        const message = friendlyError(result.error);
        setError(message);
        setSyncStatus("error");
        setLastError(message);
        return;
      }
      setActiveTag(normalized);
      setLastSyncAt(result.fetchedAt);
      setLastError(null);
      setSyncStatus("idle");
      setInput("");
      if (redirectTo) await navigate({ to: redirectTo });
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
    <form onSubmit={handleSave} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="playerTag"
          className="text-muted-foreground text-[11px] tracking-wide uppercase"
        >
          {label}
        </label>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-muted-foreground",
              size === "lg" ? "text-3xl" : "text-2xl",
            )}
          >
            #
          </span>
          <input
            id="playerTag"
            value={input}
            spellCheck={false}
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="20Q09Y0JU"
            aria-invalid={invalid}
            className={cn(
              "tnum w-full border-b bg-transparent pb-2 font-semibold tracking-wide outline-none",
              "placeholder:text-muted-foreground/30",
              size === "lg" ? "text-3xl" : "text-2xl",
              invalid
                ? "border-destructive"
                : "border-hairline focus:border-primary transition-colors",
            )}
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
        <Button
          type="submit"
          size={size === "lg" ? "lg" : "default"}
          disabled={saving || !input || invalid}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" />
              Fetching village…
            </>
          ) : (
            <>
              {submitLabel}
              <ArrowRight />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
