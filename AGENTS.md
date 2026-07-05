# AGENTS.md — TripAssist (MVP branch)

> Canonical orientation for anyone (human or agent) working in this repo.
> `CLAUDE.md` is a symlink to this file. If older docs (README, `docs/product/brief.md`,
> `docs/architecture/spec.md`) disagree with this file on the **narrative**, this file wins —
> those docs predate the pivot and are being brought in line.
>
> **This is the `mvp` branch: the working prototype only.** The stylized story landing page
> (the "demo") and its asset tooling live on the **`concept`** branch, not here. Don't
> re-add `apps/demo` / `tooling/demo` to this branch.

## What TripAssist is

AI trip-orchestration for travelers with disabilities. The product's job is to make
accessibility **guaranteed and traceable**, not left to the traveler to chase.

**Canonical narrative — initial reservation (proactive setup).** From the moment a trip is
booked, an AI agent secures accessibility end-to-end **before departure**: it reads the
itinerary and **proactively calls the providers** — the airport for wheelchair assistance
(WCHC) and the hotel for a roll-in shower — obtains structured confirmations, and logs them
to a registry. The traveler simply receives confirmations. This is the flow the MVP
implements.

> **Disruption / re-planning is a _future_ direction, not the current center.** The earlier
> build was organized around reactive disruption handling (SNCF delay → replan → re-confirm).
> That remains an interesting capability we may bring into the MVP later, but it is no longer
> what the MVP leads with. Treat disruption code/docs as legacy-but-kept.

Persona: **Camille Moreau**, 34, electric wheelchair (Permobil M3). Needs: step-free routing,
roll-in shower, boarding/deboarding assistance. Trip: **Paris → Nice**. UI/voice: **French**.

Accessibility is the product, not a finish: WCAG AA, full keyboard nav, visible focus,
`prefers-reduced-motion` honored, `aria-live` on live regions — the MVP must itself be
accessible.

## The deliverable

**The MVP** — the real Express + React app (at the repo **root**: `server/`, `web/`,
`shared/`), centered on the initial-reservation flow, hardened over time to do real work
(real Vapi calls, real Claude agents, real open-data plugins, persistence).

> The stylized static **story landing page** (`apps/demo`, → GitHub Pages) and its asset
> generators (`tooling/demo`) live on the **`concept`** branch. This branch is intentionally
> free of them.

## Repo structure

The MVP is the single root package — no `apps/mvp` move, no `packages/shared` extraction yet.
Those are a clean post-hackathon step if shared code actually grows.

```
TripAssist/
├─ package.json            # the MVP (root package): server/ + web/ + shared/
├─ pnpm-workspace.yaml     # kept only for pnpm 11's build-script allowlist
├─ server/  web/  shared/  # MVP
├─ docs/                   # deeper docs (some predate the pivot — see banners)
└─ AGENTS.md / CLAUDE.md   # this file
```

## Dev conventions

- **Invoke tools via `node node_modules/<pkg>/...`, never `npx`/`pnpm exec`/bare bins.** The
  working folder path breaks the `node_modules/.bin` PATH shim; every script (and the git
  hooks) calls `node` directly. Keep it that way.
- TypeScript **strict**. Vitest, ESLint (flat config), Prettier. Lefthook installs hooks on
  `pnpm install`: pre-commit = Prettier `--write` + ESLint `--fix` on staged; pre-push =
  `typecheck` + `test`.

```bash
pnpm install
pnpm dev           # Express (3000) + Vite (5173)
pnpm test          # Vitest
pnpm typecheck
```

## Environment

Copy `.env.example` → `.env`. MVP live mode needs `ANTHROPIC_API_KEY` + `VAPI_*`. The MVP
runs offline with deterministic fallbacks when keys are absent.

## Status & roadmap (as of 2026-07-04)

**Shipped.** MVP hardened: real Vapi calls wired (see below), real Claude reasoning (HTTP
token or `ANTHROPIC_VIA_CLI` bridge; deterministic fallbacks are a tests/CI path only),
booking ingestion (`POST /api/ingest`), six open-data plugins (SNCF ×2, OSM, Open-Meteo live
keyless; Navitia / acceslibre / ORS live with free tokens), durable SQLite store
(`server/store.ts`), additive multi-tenant auth (`server/auth.ts` — anonymous traffic
resolves to the `demo` tenant so it stays open). Current map:
`docs/architecture/ARCHITECTURE.md`.

**Open — MVP deploy.** The MVP still needs a Node host (Render/Fly/Railway — Express +
SSE + Vapi webhooks can't go static). Blocked on a hosting choice + account, not on code.

**Live dialing is gated.** Vapi is wired end-to-end, but do **not** place a real outbound
call without an explicit go-ahead; the offline simulated call is the default/test path.
Runbook: `docs/guides/vapi-setup.md`.

**Decisions already made — don't re-litigate:**

- The **demo lives on the `concept` branch**, not here; this branch is MVP-only.
- UI/voice is **French-only**; transcript components stay language-agnostic but no bilingual
  toggle is built.
- MVP stays the single root package.

**Deferred (post-hackathon, only if the need materializes):** `apps/mvp` move +
`packages/shared` extraction; real password store / operator CRUD (auth is seeded
operators); full rewrites of the pre-pivot docs (`docs/architecture/spec.md`,
`docs/product/brief.md` — their ⚠️ banners are deemed sufficient); reviving the
disruption / re-planning flow as an MVP feature.
