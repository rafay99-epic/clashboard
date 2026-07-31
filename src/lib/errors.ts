export function friendlyError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : String(err ?? "");

  const message = stripConvexNoise(raw);
  const lowered = message.toLowerCase();

  if (!message) return "Something went wrong. Try again.";

  if (lowered.includes("coc_api_token")) {
    return "The backend has no Clash of Clans API key. Set it with: npx convex env set COC_API_TOKEN '<your-key>'";
  }
  if (lowered.includes("403") || lowered.includes("token rejected")) {
    return "Clash API rejected the key (403). The key is locked to an IP — allow this server's IP on developer.clashofclans.com.";
  }
  if (lowered.includes("not found") || lowered.includes("404")) {
    return "No player with that tag. Check it in game under Settings → My Account.";
  }
  if (lowered.includes("rate limit") || lowered.includes("429")) {
    return "Clash API rate limit hit. Wait a minute and sync again.";
  }
  if (
    lowered.includes("failed to fetch") ||
    lowered.includes("networkerror") ||
    lowered.includes("websocket") ||
    lowered.includes("econnrefused")
  ) {
    return "Can't reach the tracker backend. Check that `bun run convex:dev` is running.";
  }
  if (lowered.includes("maintenance") || lowered.includes("in maintenance")) {
    return "Clash of Clans servers are in maintenance. Try again once the game is back.";
  }

  return message;
}

function stripConvexNoise(raw: string): string {
  return raw
    .replace(/\[Request ID: [^\]]+\]/g, "")
    .replace(/\bUncaught (Error|ConvexError):?/g, "")
    .replace(/\bServer Error\b/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("at "))
    .join(" ")
    .trim();
}
