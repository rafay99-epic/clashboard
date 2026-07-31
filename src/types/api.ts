export type SyncResult =
  | { ok: true; fetchedAt: number; name: string }
  | { ok: false; error: string; retryAfterMs?: number };

export type VerifyResult =
  | { ok: true; verified: boolean; verifiedAt?: number }
  | { ok: false; error: string };
