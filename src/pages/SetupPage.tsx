import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function SetupPage() {
  const navigate = useNavigate();
  const syncPlayer = useAction(api.players.sync.syncPlayer);

  const setPlayerTag = useAppStore((s) => s.setPlayerTag);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setLastSyncAt = useAppStore((s) => s.setLastSyncAt);
  const setLastError = useAppStore((s) => s.setLastError);

  const [playerTag, setPlayerTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerTag.trim()) {
      setError("Enter your player tag.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setSyncStatus("syncing");
      const result = await syncPlayer({ playerTag: playerTag.trim() });

      setPlayerTag(playerTag.trim());
      setLastSyncAt(Date.now());
      setLastError(null);
      setSyncStatus("idle");

      if (!result.ok) {
        setError(result.error);
        return;
      }
      await navigate({ to: "/" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch player.";
      setError(message);
      setSyncStatus("error");
      setLastError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Set up tracking</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your Clash of Clans player tag. No API key needed — the backend
          handles it securely.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player</CardTitle>
          <CardDescription>
            Find your tag in-game: Settings → Account → Player tag (starts with
            #).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="playerTag">Player tag</Label>
              <Input
                id="playerTag"
                placeholder="#20Q09Y0JU"
                value={playerTag}
                onChange={(e) => setPlayerTagInput(e.target.value)}
              />
            </div>

            {error ? (
              <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching player...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save &amp; fetch player
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
