# TripAssist

**AI trip-orchestration for travelers with disabilities** — making accessibility
_guaranteed and traceable_ instead of something the traveler has to chase. From the
moment a trip is booked, an AI agent secures accessibility end-to-end **before
departure**: it reads the itinerary and proactively calls the providers — the airport
for wheelchair assistance (WCHC), the hotel for a roll-in shower — obtains structured
confirmations, and logs them to a registry.

> **This branch (`main`) is the static demo showcase.** It ships two zero-key, fully
> static apps deployed to GitHub Pages. The **functional MVP** (Express + React + Claude
> agents + Vapi calls + open-data plugins + SQLite) lives on the **`mvp` branch** — see
> [_Branch split_](#branch-split) below.

Canonical narrative, repo map, and conventions: [`AGENTS.md`](AGENTS.md).

## The two demos

The two demos are **two entry points of one Vite app** — `src/story` renders the root
`index.html`, `src/dashboard` renders `dashboard/index.html`.

| Demo                                     | What it is                                                                                                                                                                                                                                           | Live                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Story landing page** (`src/story`)     | A stylized, animated 7-scene story: the agent receives Camille's itinerary, **calls the airport**, **calls the hotel**, and she gets two phone confirmations. Individual traveler's view.                                                            | **<https://shbernal.github.io/TripAssist/>**           |
| **Operator dashboard** (`src/dashboard`) | A tour operator ("chief") who bought TripAssist, managing a group of ~20 seniors & travelers with disabilities on the same Paris→Nice trip. A **guided onboarding tour** reveals each solution aspect over a live-looking, fixture-backed dashboard. | **<https://shbernal.github.io/TripAssist/dashboard/>** |

Both are **static, zero-key, and deterministic** — all AI-generated media (faces, call
audio) is committed, so they build and deploy with no secrets. The two entries cross-link
so you can move between the individual story and the operator view.

## Accessibility is the product

Not a finishing touch — the demos must themselves be accessible: **WCAG AA**, full
keyboard navigation, visible focus, `prefers-reduced-motion` honored, `aria-live` on
live regions, semantic landmarks, French UI. The landing page scores **Lighthouse
a11y 100/100**; the dashboard's onboarding tour is keyboard-operable with a focus trap
and announced step changes.

## Run & build

A single **Vite app** with two HTML entry points (`index.html` for the story,
`dashboard/index.html` for the dashboard) sharing one `base`, `/TripAssist/`. All tooling
is invoked via `node node_modules/<pkg>/...` — the repo path can contain a `:` that
corrupts the `node_modules/.bin` PATH shim, so `npx`/`pnpm exec`/bare bins are avoided
everywhere, including in the git hooks.

```bash
pnpm install

# one dev server (:5173) serving BOTH entries:
#   story     → http://localhost:5173/TripAssist/
#   dashboard → http://localhost:5173/TripAssist/dashboard/
pnpm dev

pnpm build           # static build → dist/ (index.html + dashboard/index.html)
pnpm typecheck
pnpm lint
pnpm format
```

Vite emits both HTML files under `base: '/TripAssist/'`, and the two entries cross-link
via `BASE_URL` so the links work the same locally and on Pages. Deeper docs:
[`src/story/README.md`](src/story/README.md) ·
[`src/dashboard/README.md`](src/dashboard/README.md) ·
[`tooling/demo/README.md`](tooling/demo/README.md) (regenerating faces & call audio).

## Deploy

GitHub Pages serves **one** site. [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml)
runs `pnpm build` on every push to `main` and publishes `dist` as-is — Vite already emits
the landing page at the root and the dashboard nested under `/dashboard/`, so there's no
artifact to assemble. No external account or secret is needed.

## Branch split

- **`main`** (this branch) — the audited **static demo showcase**: one Vite app with
  `src/story` + `src/dashboard` entries, deployed to GitHub Pages. No backend, no keys.
- **`mvp`** — the **functional MVP**: the real Express + React app with Claude agents,
  Vapi phone calls, open-data plugins, SQLite persistence, and multi-tenant auth. That
  branch keeps the full server/web/shared tree and its own docs.

The two share the same product narrative; they differ in what runs. All future
_functional_ work happens on `mvp`; `main` stays a clean, self-contained static demo.

## Environment

The apps need **no keys to run** — the only key is `ELEVENLABS_API_KEY`, and only to
**regenerate** the landing page's call audio via
[`tooling/demo/`](tooling/demo/README.md). Set it in a `.env` file at the repo root (the
voice generator loads it), then run `pnpm assets:voices`. The MVP's
`ANTHROPIC_*`/`VAPI_*` keys live on the `mvp` branch.
