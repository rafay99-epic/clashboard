# Clashboard

**Your village, measured against max.**

A Clash of Clans progress tracker that answers one question honestly: what is
actually left to upgrade. Paste a player tag — no login, no API key, nothing to
install.

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

**Accounts** — track as many player tags as you like and switch between them in
one click. Optionally verify a tag is yours with the one-time API token from the
game (`Settings → More Settings → API Token`).

## Stack

| Layer    | Choice                                                       |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, Vite, TanStack Router, Tailwind v4, Zustand         |
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
| `bun test`                | unit tests (roster join, army decoding, accounts) |
| `bun run format`          | Prettier over source, backend and scripts        |
| `bun run build`           | production build                                 |
| `bun run generate:roster` | rebuild `roster-manifest.json` and `army-index.json` |

## Layout

```
convex/          backend: coc/ API client, players/, battles/, roster/, sync/
src/pages/       Landing, Dashboard, Roster, Battles, Accounts
src/components/  layout shell, shared UI primitives
src/lib/         roster join, army-code decoder, error mapping
tests/           bun tests mirroring src/
```

Routes are gated: without a saved player tag only `/` is reachable, and no
Convex query is issued until a tag exists.

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
