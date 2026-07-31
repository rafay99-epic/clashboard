declare const process: { env: Record<string, string | undefined> };

export function getCocApiToken(): string {
  const token = process.env.COC_API_TOKEN;
  if (!token) {
    throw new Error(
      "COC_API_TOKEN is not set. Run: npx convex env set COC_API_TOKEN '<your-key>'",
    );
  }
  return token;
}
