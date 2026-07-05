---
name: review-code
description: Guided audit path for reviewing the TripAssist codebase (human or AI reviewer). Use when asked to review, audit, evaluate, or judge this repo's architecture, code quality, accessibility, or "how real is it". Walks the code in the order that best shows the design and states exactly what to verify.
---

# Reviewing TripAssist

You are reviewing **TripAssist**: an AI trip-orchestration app for travelers with disabilities.
This skill gives you a fast, fair, file-by-file audit path and tells you exactly what to check
at each stop. Read [`AGENTS.md`](../../../AGENTS.md) first for the narrative and the map; this
skill is the "how to review" companion to it.

The guiding principle you are checking against: **the app never breaks without keys (verified
deterministic fallbacks), and goes live the moment a key is present, with no UI change.** Treat
that as the design thesis and confirm it holds everywhere.

## How to run it (5 commands)

```bash
pnpm install
pnpm test          # 94 tests: agents, plugins (fetch mocked), SSE reducer, state machine,
                   # SQLite store, ingestion, auth, integrity invariants, rendering
pnpm typecheck     # TypeScript strict, front + back, must be clean
pnpm dev           # Express :3000 + Vite :5173
curl localhost:3000/api/context | jq   # live SNCF / OSM / weather, each with a traced source
```

To confirm the reasoning is real Claude and not the fallback, without an HTTP token:

```bash
ANTHROPIC_VIA_CLI=1 pnpm start   # then exercise ingestion / planner and inspect the output
```

Do **not** place a real outbound phone call. Live dialing is intentionally gated; the in-browser
web call and the scripted simulation are the safe paths and share the same pipeline.

## The review path (in this order)

Review in this order. It moves from the product entry point outward, so each file makes sense in
context.

1. **`server/ingest.ts`**: the product's entry point. Free-text booking → structured trip
   (steps, dependencies, accessibility needs) via Claude, with a deterministic fallback.
   _Check:_ the trip shape is validated; the fallback produces a coherent trip offline.

2. **`server/agents/`**: the five agents (`planner`, `extractor`, `vision`, `watchdog`,
   `caller`) plus `claude.ts` (the client) and `trace.ts` (reasoning stream).
   _Check:_ every agent gates on real Claude via `claude.ts` and degrades to a deterministic
   result; `claude.ts` routes HTTP token → CLI bridge → fallback in that order; the reasoning
   traces are emitted as SSE, not faked in the front.

3. **`server/plugins/`**: seven open-data feeds (SNCF ×2, OSM, Open-Meteo, Navitia,
   acceslibre, OpenRouteService).
   _Check:_ one shared contract everywhere: **real attempt → short timeout → cache → verified
   reference fallback**; the `*.test.ts` files mock `fetch` and assert both the live-parse and
   the fallback branches. No feed can block the app.

4. **`server/store.ts` + `server/auth.ts`**: durable multi-tenant SQLite on native
   `node:sqlite` (zero deps), with additive auth (anonymous traffic resolves to a `demo`
   tenant, so the app stays open).
   _Check:_ persistence is real and survives restart; tenancy scopes trips; auth is additive,
   not a wall.

5. **`shared/reference.ts` + `server/validate.ts`**: the source of truth (real UIC station
   codes, IATA SSR codes, B2B client registry, regulatory standards) and the tested integrity
   invariants over it.
   _Check:_ the reference data is real and verifiable (spot-check a UIC code); `validateAppState`
   rejects a deliberately broken state (see `validate.test.ts`).

6. **`server/index.ts` + `server/events.ts` + `server/routes/`**: one Express process serving
   the REST API, the single SSE hub (`pushEvent`), the Vapi webhook, and the built front.
   _Check:_ one stream, one process; SSE event contract is coherent.

7. **`web/src/`**: React 18 + Vite, four views (Fleet, Traveler, Ops/control-center, Report),
   `useEvents.ts` reduces the SSE stream into state.
   _Check:_ the front hydrates from `GET /api/state` then lives entirely off SSE; state is a
   reducer, not scattered polling.

## Accessibility (this is the product, review it as such)

Accessibility is a core deliverable, not polish. Verify, don't take on faith:

- Semantic landmarks; `aria-live="polite"` on the timeline, watchlist, agent log, and call
  transcript (grep `aria-live` across `web/src`).
- Full keyboard operability and visible focus on interactive steps/controls.
- `prefers-reduced-motion` honored (grep `prefers-reduced-motion` / reduced-motion guards).
- WCAG AA contrast; light/dark theme persistent.
- French UI throughout; transcript components stay language-agnostic underneath.

A screen-reader pass (VoiceOver/Orca/NVDA) on the traveler view is the highest-signal manual
check.

## What "good" looks like here

- **Real, not mocked:** Claude reasoning (HTTP or CLI bridge), live keyless open data (SNCF,
  OSM, Open-Meteo), durable SQLite, wired Vapi. Fallbacks are verified reference data, present
  so the demo and CI never break, not the default when a key exists.
- **One contract, applied uniformly:** every external call (AI or data) degrades gracefully the
  same way. Consistency is the point.
- **Tests assert both branches:** live-parse and fallback, with `fetch` mocked. CI runs the
  fallback path deterministically.
- **Deliberate scope, not gaps:** single root package, French-only, the stylized landing page
  on a separate `concept` branch. See `AGENTS.md` → "Design decisions worth understanding".

## Fair-review notes

- The offline fallbacks are a **feature**, not a shortcut. Judge them as designed resilience.
- Absent keys is the _default_, so a fresh clone shows reference data (gray "référence"
  badges). Add a key and the same source flips to live (green). No UI changes; that is the
  design working.
- Don't penalize the single-package layout or French-only UI; both are documented, intentional
  choices for a focused deliverable.
- The disruption / re-planning flow is real and working code, not vestigial; the initial
  reservation is simply what the product leads with.
