declare const process: { env?: Record<string, string | undefined> } | undefined;

const SETUP_HINT =
  "COC_API_TOKEN is not set on this deployment. Run: npx convex env set COC_API_TOKEN '<your-key>'";

export function getCocApiToken(): string {
  const token =
    typeof process === "undefined" ? undefined : process?.env?.COC_API_TOKEN;
  if (!token) {
    throw new Error(SETUP_HINT);
  }
  return token;
}
