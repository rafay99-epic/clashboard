# Clash of Clans Progress Tracker — Build Plan

A data-driven app that tracks a player's Clash of Clans progress live, showing maxed vs. not-maxed troops, spells, heroes, and buildings with real game images.

**Repo:** `clashofclan` · **Date:** 2026-07-31

---

## Research Notes

### 1. Clash of Clans Official API

- Portal: `https://developer.clashofclans.com` — create an API token, then the token is used as a **Bearer token** on every request: `Authorization: Bearer <token>`.
- Spec URL is set via a `game-api-url` cookie (server-rendered Swagger UI), so the swagger.json can't be fetched statically — confirmed by probing. Endpoints are well known:
  - `GET /v1/players/{playerTag}` — full player profile (troops, heroes, spells, buildings, upgrades, leagues, etc.)
  - `GET /v1/clans/{clanTag}` — clan data
  - `GET /v1/locations`, `GET /v1/leagues`, `GET /v1/players/{playerTag}/legendleague` etc.
- **Rate limit:** 30 requests per minute per API key. CoC API returns `429` with a `Retry-After` header on throttling.
- Player tags are URL-encoded: `#` → `%23` (e.g. `#2ABC123` → `%232ABC123`).
- **API v2 player shape (2026) — verified against live response:**
  - `troops[]` — regular troops, super troops, siege machines, builder-base troops AND pets, each with `village` (`home` / `builderBase`). Pets (L.A.S.S.I, Unicorn, etc.) live here, NOT in a separate array.
  - `heroes[]` — each hero has nested `equipment[]` (equipped items).
  - `heroEquipment[]` — ALL owned hero equipment with level/maxLevel.
  - `spells[]` — home village spells only.
  - **There is NO `buildings[]` or `traps[]` array** — the player API never exposes building levels. Building level progress is only inferable from achievements.
  - Stats include `warStars`, `donations`, `donationsReceived`, `clanCapitalContributions`, `builderBaseTrophies`, `bestBuilderBaseTrophies`, `leagueTier`, `builderBaseLeague`, `clan.badgeUrls`, `playerHouse`, `labels`.
- Player profile arrays (each item has `name`, `level`, `maxLevel`):
  - `troops[]`, `heroes[]`, `spells[]` — player's army
  - `buildings[]` — every building in home village with `name` + `level` (building `maxLevel` not included per-building in all cases; `maxLevel` is present on troops/heroes/spells).
  - `achievements[]`, `playerAchievements[]`, `troopIds`/`heroIds` (spell/equipment ids in newer responses)
- `townHallLevel`, `builderHallLevel`, `expLevel`, `trophies`, `bestTrophies`, `attackWins`, `defenseWins`, `clan`, `league`, `legendStatistics`, `labels` are all on the player object.

### 2. Static game images + roster data

- **`clash-of-clans-data` npm package (v0.16.0, MIT)** — the single best source:
  - Complete typed game data: home village defenses, traps, troops, spells, siege machines, heroes, hero equipment, pets, resource buildings, army buildings; builder base; clan capital; clan levels/labels; leagues.
  - **2207 PNG images bundled** in `node_modules/clash-of-clans-data/images/...` (e.g. `images/home/troops/barbarian/icon.png`, `images/home/defenses/cannon/normal/level-7.png`).
  - Fluent API: `home().troops().barbarian().first()`, `home().defenses().byTownHall(12).get()`, etc.
  - Data model per entity: `{ id, name, category, base, images: { icon }, levels: [{ level, images: { normal } }] }`.
  - **Approach:** vendor the package's `data/` + `images/` into the app at build time (generate a static JSON manifest + import images via Vite's `import.meta.glob`), so images resolve to CDN-free static assets. This avoids fetching from external hosts and gives us the "disable" state mapping: player API `name` ↔ manifest `name`.
  - Fallback if bundling is awkward: use `import.meta.glob` over `node_modules/clash-of-clans-data/images/**/*.png` directly (Vite supports globbing node_modules files).

### 3. Convex backend components

- **`@convex-dev/rate-limiter`** (v0.3.2) — application-layer rate limiting:
  - `convex.config.ts`: `app.use(rateLimiter)`
  - `new RateLimiter(components.rateLimiter, { cocApi: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 30 } })`
  - `await rateLimiter.limit(ctx, "cocApi", { key: tokenHash })` — transactional, fails closed.
- **`@convex-dev/workflow`** (v0.4.4) — durable workflows (pauses, retries, waits, steps). We use it for the continuous-sync "pipeline": fetch → transform → store, with retry on 429/5xx.
- Convex has built-in **cron jobs** (`cronJobs.interval` in `convex/crons.ts`) for periodic re-fetching.
- Convex mutations/actions run in Node and can `fetch` the CoC API directly (server-side = token never leaves our backend).
- Convex is WebSocket-based: `useQuery`/`useMutation`/`useAction` push updates live to the client automatically.

---

## Architecture

```
┌───────────────────────────────┐
│  Vite + React (TS)            │
│  TanStack Router  · Zustand   │
│  TanStack Query  · Convex     │
│  Tailwind + shadcn/ui         │
│  (default theme, base + shadcn│
│   components only)            │
└──────────────┬────────────────┘
               │ useQuery / useMutation / useAction  (convex/react)
               ▼
┌───────────────────────────────┐
│  Convex backend (Node)        │
│  - COC_API_TOKEN env var      │
│    (server-side only)         │
│  - players, snapshots         │
│  - roster manifest            │
│  - rate limiter component     │
│  - workflow component         │
│  - cron sync job              │
└──────────────┬────────────────┘
               │ fetch (Bearer token from env)
               ▼
┌───────────────────────────────┐
│  Clash of Clans official API  │
└───────────────────────────────┘
```

**Data flow:**
1. User enters **only their player tag** on `/setup`. No API key is ever collected client-side.
2. Convex reads the shared `COC_API_TOKEN` env var (`convex/env.ts`), calls `/v1/players/{tag}` server-side, stores normalized `players` + `snapshots`.
3. Dashboard reads live via Convex query (auto-sync over WebSocket).
4. Cron (every N minutes) + manual refresh button → workflow re-fetches latest data and upserts snapshot.
5. Roster manifest (from `clash-of-clans-data`) maps each troop/spell/hero/building → image + max level. UI shows level vs max and "disabled/maxed" states.

**State management (Zustand):** active player tag, selected base tab (Home/Builder/Capital), sync status. TanStack Query handles any direct HTTP needs (none expected beyond Convex, but wired for image preloading). TanStack Router for routes: `/` (dashboard), `/setup` (tag only), `/roster` (gallery).

---

## Tech Stack (final)

| Concern | Choice |
|---|---|
| Package manager | **bun** (bun.lock; `bun install`, `bun run`) |
| Build | Vite 8 + React 19 + TypeScript 6 |
| Styling | Tailwind CSS v4 + shadcn/ui (base components, default theme) |
| Formatting | Prettier 3 + prettier-plugin-tailwindcss |
| Code health | react-doctor (100/100) |
| Routing | TanStack Router |
| State | Zustand |
| Data fetching | TanStack Query (for anything non-Convex) |
| Backend | Convex (schema, queries, mutations, actions, cron) |
| Rate limiting | `@convex-dev/rate-limiter` |
| Workflows | `@convex-dev/workflow` |
| Game data/images | `clash-of-clans-data` |

---

## Tasks

- [x] Research CoC API endpoints/auth/rate limits
- [x] Research static image + roster data source
- [x] Research Convex rate-limiter + workflow components
- [x] Write PLAN.md (this file)
- [x] Scaffold Vite React project with Tailwind + shadcn/ui
- [x] Initialize Convex (config, schema, rate limiter, workflow)
- [x] Convex backend: token storage + CoC API fetch layer
- [x] Client foundation: Router, Zustand, Query, Convex client
- [x] UI: token entry + player dashboard
- [x] Gallery: troops/spells/heroes/buildings with live disable states
- [x] Continuous sync: cron + on-demand refresh
- [x] Verify: typecheck, lint, build, dev smoke test
- [x] Final update to this file

---

## ✅ Status: COMPLETE (2026-07-31)

All tasks done and verified end-to-end with a REAL player + token.

- **Backend (Convex)**: `players`, `snapshots`, `battleLogs`, `roster` tables deployed with **fully-typed validators** (`convex/schema.ts` defines `cocUnitValidator`, `cocHeroValidator`, `cocBuildingValidator`, `playerValidator` — zero `v.any()`). `@convex-dev/rate-limiter` (30 req/min token bucket, shared backend key) + `@convex-dev/workflow` (durable sync with retry) components installed; cron sync every 15 min; 255 roster entries seeded.
- **API modules**: shared `cocRequest()` helper (`convex/coc/request.ts`) handles rate-limit + retry/backoff + auth for all CoC endpoints. Actions: `coc/fetch.ts` (player profile), `coc/battlelog.ts` (battle log). Feature modules: `players/` (sync/queries/normalize), `roster/` (seed/queries), `battles/` (sync/queries), `sync/` (cron/workflows).
- **Security**: the CoC API key lives ONLY in the `COC_API_TOKEN` Convex env var (`convex/lib/env.ts`). The `tokens` table and all tokenId plumbing were removed — clients only ever send a player tag. Setup page is tag-only.
- **Battle log**: `/battles` page shows the latest 48 battles (real data verified) — attack/defense badge, battle type (ranked/homeVillage), win/loss, 0-3 star rating, destruction % progress bar, looted resources (Gold/Elixir/DarkElixir), duration, timestamp. Summary cards: total / attacks / wins. Manual refresh via `battles/sync:syncBattleLog`; stored in `battleLogs` (latest replaces previous).
- **Typing**: strict end-to-end. `normalizePlayer()` (`convex/players/normalize.ts`) converts the raw API response into the typed schema shape; snapshot rows store the normalized shape, not raw API blobs. ESLint enforces `no-explicit-any` + unsafe-* rules as errors across `src/`, `scripts/`, and `convex/` (typed linting via `parserOptions.project`). `bun run check` = typecheck + lint.
- **Client**: Vite 8 + React 19 + TS 6, Tailwind v4 + shadcn/ui base components (default theme), TanStack Router (`/`, `/setup`, `/roster`, `/battles`), Zustand (persisted tag/base), Convex WebSocket live sync, TanStack Query wired.
- **Roster images**: 255 PNGs vendored from `clash-of-clans-data` into `public/images/`; manifest in `src/data/roster-manifest.json` (regenerate: `bun run generate:roster`).
- **Smoke test (real data)**: `Rafay99` (#20Q09Y0JU, TH18) synced via tag-only setup through the fully typed pipeline. Dashboard shows TH18, war stars 2,503, donations 3,765, capital gold 1.7M, builder trophies 3,816, progress Troops 74% / Spells 87% / Heroes 93% / Pets 93%. Roster gallery shows live levels for troops, all 12 pets, all 39 hero equipment; buildings/traps shown as "Up to Lv X" info-only (API limitation). Battle log shows 48 real battles with loot/destruction/stars.

### Checks

```bash
bun run check          # typecheck (tsc -b) + lint (eslint) — 0 errors
bun run format         # prettier --write
bun run format:check   # prettier --check
bun run doctor         # react-doctor — 100/100, no issues
bun run dev:all        # Vite + Convex dev together
bun run build          # tsc -b && vite build
```

- **Toolchain (2026-07-31)**: bun 1.3.x, Vite 8.2, React 19.2.8, TypeScript 6.0.3, ESLint 10.8, Prettier 3.9, Tailwind 4.3, TanStack Router 1.170, TanStack Query 5.101, Zustand 5.0, Convex 1.42.
- **TypeScript 7 note**: TS 7.0.2 is released, but `typescript-eslint` hard-blocks it ("does not support TS 7.0"). The project uses TS 6.0.3 (latest supported by the whole lint toolchain); flipping to `typescript@^7` works for `tsc -b` but breaks ESLint until typescript-eslint adds support (tracked upstream).
- **react-doctor config**: `doctor.config.json` ignores `convex/**` (Convex loads functions by convention, so dead-code analysis is a false positive) and `src/components/ui/**` (shadcn exports variants alongside components); `deslop/unused-dependency` is off because `clash-of-clans-data` is used by the build-time roster generator.
- The only lint output is 2 fast-refresh warnings in the shadcn `button`/`badge` components (standard upstream warnings, not errors).

### Run it

```bash
bun install                 # installs everything (bun.lock)
bun run generate:roster     # regenerate manifest + copy images (one-time)
bun run dev:all             # both servers — Convex :3210 + Vite :5173
```

Then open http://localhost:5173 → Setup → paste your player tag. The CoC API key is a Convex env var set once with `bunx convex env set COC_API_TOKEN '<your-key>'`.

**One-time seed** (already done locally, but needed for a fresh deployment):

```bash
bunx convex run roster:seedRoster '{}'
```

### Production notes

- Deploy Convex: `bun run convex:deploy` (requires `bunx convex login`), then set `VITE_CONVEX_URL` to the deployed URL and rebuild.
- **The API key is a Convex env var, not app code or a DB table.** Set it per deployment:
  ```bash
  bunx convex env set COC_API_TOKEN '<your-key>'        # dev
  bunx convex env set COC_API_TOKEN '<your-key>' --prod # prod
  ```
  The key's IP allowlist must include the deployment's egress IPs (prod) or your machine (local dev).
- Rate limiting is enforced server-side on one shared token bucket; the CoC API's own 429s are retried with backoff in `cocApi.ts`.
- Continuous sync: `crons.ts` runs `syncAllPlayers` every 15 min → `workflows.ts` durable workflow per player (retry/backoff, exactly-once).
- Player tags are normalized to uppercase without `#` for DB keys (`normalizePlayerTag` server-side, `normalizeTag` client-side).
- `seedTestPlayer` / `clearTestData` mutations exist for local dev smoke testing.

---

## Notes / Decisions

- Token stored server-side in Convex; never sent back to the browser. Client only ever calls Convex.
- Player tag + token are the two user inputs (per request: "user to enter the access token once u have it").
- "Continuous fetch" = Convex cron interval (e.g. every 15 min) + manual refresh + workflow retry/backoff, all rate-limited to 30 req/min budget.
- Images: vendored from `clash-of-clans-data` at build time into `public/` or imported via `import.meta.glob`. This satisfies "image search where u can find full coc image and then based on the data disable them."
- Live updates: Convex `useQuery` subscribes to snapshots; Zustand mirrors UI state; no manual polling needed client-side.
