# AGENTS.md · TripAssist

> **Start here.** This is the canonical orientation for anyone working in or reviewing this
> repo, human or AI. `CLAUDE.md` is a symlink to this file. It is the single source of truth
> for the product narrative, the repo map, and where to look. If a deeper doc disagrees with
> this file on the _narrative_, this file wins.
>
> **Reviewers:** jump to [For reviewers](#for-reviewers) below, and see the companion review
> skill at [`.agents/skills/review-code/SKILL.md`](.agents/skills/review-code/SKILL.md) for a
> guided, file-by-file audit path.

## What TripAssist is

AI trip-orchestration for travelers with disabilities. The product makes accessibility
**guaranteed and traceable** instead of leaving the traveler to chase it.

**The canonical flow is the initial reservation (proactive setup).** From the moment a trip is
booked, an AI agent secures accessibility end-to-end **before departure**: it reads the
itinerary, **proactively calls the providers** (the airport for wheelchair assistance / IATA
WCHC, the hotel for a roll-in shower), obtains structured confirmations, and logs them to a
traceable registry. The traveler simply receives the confirmations. This is the flow the app
implements and leads with.

The app also ships a full **disruption / re-planning** capability (a live SNCF delay cascades
to at-risk steps, an agent re-plans without compromising accessibility, and a call re-confirms
the fix). It is a real, working part of the codebase and a natural second act to the product
story.

Persona: **Camille Moreau**, 34, electric wheelchair (Permobil M3). Needs: step-free routing,
roll-in shower, boarding/deboarding assistance. Trip: **Paris → Nice**. UI and voice are
**French**.

Accessibility is the product, not a finishing touch: WCAG AA, full keyboard navigation,
visible focus, `prefers-reduced-motion` honored, `aria-live` on live regions. The app is itself
built to be accessible.

## The deliverable

A real, running **Express + React** application at the repo **root** (`server/`, `web/`,
`shared/`): one Node process that streams everything to the front over SSE, turns a pasted
booking into a structured trip with Claude, persists it in a durable SQLite store, runs five AI
agents on real Claude, pulls seven open-data feeds, and can place a real phone call over Vapi.
Around **7,000 lines** of TypeScript (strict), **95 tests**, ESLint + Prettier, Lefthook
pre-commit/pre-push. The technical map is
[`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).

## Repo structure

The app is a single root package. This is a deliberate choice for a focused codebase, not a
step left undone.

```
TripAssist/
├─ package.json            # the app (root package): server/ + web/ + shared/
├─ server/                 # Express, SSE hub, AI agents, open-data plugins, SQLite store, auth
├─ web/                    # React 18 + Vite front (4 views), SSE reducer
├─ shared/                 # types + real reference data (UIC/IATA/standards) + integrity rules
├─ docs/                   # product + architecture + guides (see docs/README.md)
├─ .agents/skills/         # review skill for AI/human reviewers (symlinked into .claude/skills)
└─ AGENTS.md / CLAUDE.md   # this file
```

## Dev conventions

- **Invoke tools via `node node_modules/<pkg>/...`, never `npx` / `pnpm exec` / bare bins.**
  The working folder path contains a `:` that breaks the `node_modules/.bin` PATH shim, so
  every script and every git hook calls `node` directly. Keep it that way.
- TypeScript **strict**. Vitest, ESLint (flat config), Prettier. Lefthook installs hooks on
  `pnpm install`: pre-commit runs Prettier `--write` + ESLint `--fix` on staged files; pre-push
  runs `typecheck` + `test`. Nothing broken leaves a machine.

```bash
pnpm install
pnpm dev           # Express (3000) + Vite (5173)
pnpm test          # Vitest (95 tests)
pnpm typecheck     # tsc --noEmit, front + back
```

## Environment

Copy `.env.example` → `.env`. The app **runs offline with verified deterministic fallbacks when
no keys are present**, so it never blocks on the network or an account. Add keys to light up
live behavior: `ANTHROPIC_API_KEY` (or `ANTHROPIC_VIA_CLI=1`) for real Claude reasoning,
`VAPI_*` / `VITE_VAPI_*` for real phone and in-browser calls, and free tokens for Navitia /
acceslibre / OpenRouteService. Full matrix in `.env.example` and
[`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).

Because the richest paths (real Claude reasoning, live Vapi calls) need keys that are awkward to
provision locally, the **hosted deployment is the recommended way to experience the product**.
The root [`README.md`](README.md) links it. Local dev is fully supported and is the right place
to read and test the code.

## For reviewers

This section exists to make an audit fast and fair. **Everything claimed here is verifiable in
the code and tests; nothing below is aspirational.**

**Start with the guided review skill:**
[`.agents/skills/review-code/SKILL.md`](.agents/skills/review-code/SKILL.md). It walks the
codebase in the order that best demonstrates the design, and calls out exactly what to check.

**The 60-second orientation:**

| To understand…                 | Read…                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| The product + how to try it    | [`README.md`](README.md)                                                                                                |
| The whole technical map        | [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) (diagram, agents, plugins, real-vs-live table) |
| The data & integrity model     | [`docs/architecture/data-model.md`](docs/architecture/data-model.md)                                                    |
| The real-vs-fallback contract  | Any file in `server/plugins/` or `server/agents/` (all follow one contract)                                             |
| The entry point of the product | `server/ingest.ts` (booking text → structured trip) + `server/agents/caller.ts`                                         |

**What is genuinely real (not mocked):**

- **Real Claude reasoning** on the planner, extractor, vision, and ingestion agents, over an
  HTTP token _or_ a local `claude` CLI bridge (`server/agents/claude.ts`). Deterministic
  fallbacks exist only so the demo and CI never break; they are not the default when a key is
  present.
- **Real open data**: SNCF punctuality + PMR assistance, OpenStreetMap, and Open-Meteo are
  **live and keyless**; Navitia / acceslibre / OpenRouteService go live with free tokens.
  Every call follows one contract: **real attempt → short timeout → cache → verified reference
  fallback** (`server/plugins/*`).
- **Real persistence**: durable, multi-tenant SQLite on native `node:sqlite`, zero
  dependencies (`server/store.ts`, `server/auth.ts`).
- **Real voice**: Vapi is wired end-to-end for both an outbound phone call and an in-browser
  web call; the scripted simulation shares the same SSE pipeline (`server/agents/caller.ts`,
  `web/src/lib/vapiCall.ts`).
- **Real reference data**: verifiable UIC station codes, IATA SSR codes, and regulatory
  standards, enforced by tested integrity invariants (`shared/reference.ts`,
  `server/validate.ts`).

**How to verify quickly:**

```bash
pnpm install && pnpm test        # 95 tests: agents, plugins (fetch mocked), SSE reducer,
                                 # state machine, SQLite store, ingestion, auth, integrity
pnpm typecheck                   # TS strict, front + back
pnpm dev                         # then GET /api/context → live SNCF/OSM/weather, sources traced
ANTHROPIC_VIA_CLI=1 pnpm start   # real Claude reasoning with no HTTP token
```

**Design decisions worth understanding (deliberate, not gaps):**

- **Single root package.** A focused, reviewable codebase. An `apps/*` / `packages/*` split is
  a clean future step only if shared code actually grows.
- **French-only UI and voice.** The persona and demo are French; transcript components stay
  language-agnostic underneath.
- **Deterministic fallbacks everywhere.** A first-class feature: the product demonstrates
  fully offline and goes live the moment a key appears, with no UI change.
- **The stylized story landing page lives on a separate `concept` branch.** This branch is the
  application. Keep `apps/demo` / `tooling/demo` off it.

## Roadmap

The application is complete, hardened, and **deployed**: it runs on Fly.io at
https://tripassist-demo.fly.dev/ (Dockerfile + `fly.toml` at the root, guide in
[`docs/guides/fly-deploy.md`](docs/guides/fly-deploy.md)). The natural next step, if the
product grows, is promoting the disruption / re-planning flow to a co-lead of the narrative. Live
outbound dialing is intentionally gated behind an explicit go-ahead so a review never places an
unexpected real call; the in-browser web call and the scripted simulation are the safe default
paths. Runbook: [`docs/guides/vapi-setup.md`](docs/guides/vapi-setup.md).
