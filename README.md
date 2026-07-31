# Clashboard

**Your village, measured against max.**

A Clash of Clans progress tracker that answers one question honestly: what is
actually left to upgrade. Sign in, paste a player tag, and every village you
play stays in one private place.

---

## What it does

**Overview** — league and clan identity, trophies, war stars, attack and defense
wins, donations, capital gold. Per-category progress bars where solid gold is
what is fully maxed and translucent gold is levels earned so far, plus the exact
number of upgrade levels still ahead.

**Roster** — every hero, pet, equipment piece, troop, spell and siege machine in
the game across all three villages, on one scrolling page. Search any unit,
filter to what is mid-upgrade, maxed or still locked. Buildings and traps are
listed for reference only, since the API does not expose their levels.

**Battles** — attacks and defenses as a timeline with destruction, loot taken or
lost, and defenses actually held (opponent scored zero stars) counted separately
from attack wins. Battle modes read as Multiplayer, Ranked or Clan War rather
than raw API strings.

**Army decoding** — open any battle to see the army that was used: heroes with
their pets and equipment, troops and spells with counts and total housing space.
Copy it as a Supercell `CopyArmy` link or open it straight in the game.

**Accounts** — sign in with Clerk, then link as many player tags as you like and
switch between them in one click. Optionally verify a tag is yours with the
one-time API token from the game (`Settings → More Settings → API Token`).

## Authentication

Clerk handles sign-in; Convex validates the Clerk JWT on every request.

- The browser gets a Clerk session, and `ConvexProviderWithClerk` attaches its
  JWT to every Convex call.
- Convex checks that token against the issuer named in `convex/auth.config.ts`
  and exposes the Clerk user id as `identity.subject`.
- On first authenticated load, `users.ensureUser` upserts a `users` row keyed by
  that Clerk id, so the Clerk identity is stored in Convex rather than trusted
  from the client.
- Linking a tag writes an `accounts` row joining `userId` to `playerTag`. Every
  read and every sync checks that link, so one signed-in user cannot read
  another user's villages or battle logs by guessing a tag.
- Nothing is public: player and battle queries, the roster query, and all sync
  and verify actions reject unauthenticated callers. Seeding and maintenance
  mutations are internal-only and cannot be called from a browser at all.

### Setting it up

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy the publishable key into `.env.local` (alongside the `VITE_CONVEX_URL`
   that `convex dev` writes there):

   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

3. In Clerk, create a **JWT template named `convex`** (Configure → JWT
   templates → New template → Convex). Copy its Issuer URL.
4. Give it to the Convex deployment:

   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
   ```

Without the publishable key the app renders a setup screen instead of crashing.
Without the issuer domain the backend simply trusts nobody — every gated
function returns `Sign in to continue.`

## Stack

| Layer    | Choice                                                       |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, Vite, TanStack Router, Tailwind v4, Zustand         |
| Auth     | [Clerk](https://clerk.com) sessions verified by Convex JWT auth |
| Backend  | [Convex](https://convex.dev) — queries, actions, cron, rate limiting |
| Data     | Official Clash of Clans API + `clash-of-clans-data` for sprites and ids |
| Runtime  | Bun                                                          |

## Running it

```bash
bun install
```

Set the Clash of Clans API key on the Convex deployment. Get one from
[developer.clashofclans.com](https://developer.clashofclans.com):

```bash
npx convex env set COC_API_TOKEN '<your-key>'
```

> Clash API keys are locked to the IP addresses you list when creating them. A
> key created for your home IP works against a local Convex backend but returns
> 403 from Convex Cloud — create the key with the deployment's egress IP, or
> route requests through a fixed-IP proxy.

Then run both halves:

```bash
bun run dev:all
```

`VITE_CONVEX_URL` is written into `.env.local` by `convex dev`. First run seeds
the static roster; `bun run generate:roster` regenerates it (and the army id
index) from the bundled game data.

## Scripts

| Command                   | What it does                                     |
| ------------------------- | ------------------------------------------------ |
| `bun run dev:all`         | Convex backend and Vite together                 |
| `bun run check`           | typecheck + lint                                 |
| `bun test`                | unit tests (roster join, army decoding, accounts, auth helpers) |
| `bun run doctor`          | react-doctor audit                               |
| `bun run format`          | Prettier over source, backend and scripts        |
| `bun run build`           | production build                                 |
| `bun run generate:roster` | rebuild `roster-manifest.json` and `army-index.json` |

## Layout

```
convex/          backend: auth.config.ts, lib/auth.ts, coc/, players/, battles/, roster/, sync/
src/types/       shared domain types, imported by both frontend and backend
src/pages/       Landing, Dashboard, Roster, Battles, Accounts
src/components/  layout shell, auth gates, shared UI primitives
src/lib/         roster join, army-code decoder, account selection, error mapping
tests/           bun tests for lib, store and backend helpers
```

`src/types/` is the single source of domain types. The Convex functions import
the same declarations (`SyncResult`, `VerifyResult`) that the React code
consumes, so a shape change breaks the build on both sides at once.

Routes are gated twice: `RequireAuth` blocks signed-out visitors, and
`RequireAccount` blocks signed-in users with no linked tag. No Convex query is
issued in either state.

## Notes

- Building and trap levels are absent from the Clash API. They are shown with
  their max level for reference and excluded from progress totals.
- The battle log is short-lived server-side — sync while it is fresh or entries
  are lost.
- Clan-castle segments of an army share code use ids that do not resolve against
  the public game data; they are counted rather than guessed at.

## Disclaimer

This material is unofficial and is not endorsed by Supercell. For more
information see [Supercell's Fan Content Policy](https://supercell.com/en/fan-content-policy/).
