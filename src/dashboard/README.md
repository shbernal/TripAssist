# TripAssist operator dashboard (`src/dashboard`)

A **tour-operator dashboard**: the "chief" who bought TripAssist managing a group of ~20
seniors & travelers with disabilities on the same **Paris → Nice** trip. Static, no
backend, no login, zero keys: every number and confirmation is a committed fixture.

This is the **second entry** (`dashboard/index.html`, served at `/TripAssist/dashboard/`)
of the single TripAssist app; the individual [story landing page](../story/) is the root
entry. See the root [`AGENTS.md`](../../AGENTS.md) for the repo shape.

**Live: <https://shbernal.github.io/TripAssist/dashboard/>**. Auto-deployed by
[`.github/workflows/deploy-demo.yml`](../../.github/workflows/deploy-demo.yml) on every
push to `main`.

It's the operator-side counterpart to the individual [story landing page](../story/): the
same Paris → Nice trip seen from the person who orchestrates the whole group. Camille
Moreau (the landing page's persona) appears here as traveler #1, tying the two demos
together. The two entries cross-link both ways (a "Voir l'histoire de Camille" link in the
footer; a "tableau de bord opérateur" CTA on the landing page), resolved via `BASE_URL`.

> Paths below are relative to this directory (`src/dashboard/`).

## The guided onboarding tour

The dashboard opens on a **stepped, spotlighted onboarding tour** (the intended entry
experience) that walks **six solution aspects**, each dimming the page and highlighting
the live section behind it. It's fully dismissible into free exploration and re-openable
from the top bar. Steps (`TOUR` in `App.tsx`, rendered by `components/Onboarding.tsx`):

| #   | Aspect                           | Section          | Component       |
| --- | -------------------------------- | ---------------- | --------------- |
| 1   | The group at a glance            | `tour-overview`  | `Overview.tsx`  |
| 2   | Proactive provider confirmations | `tour-proactive` | `Proactive.tsx` |
| 3   | A guarantee per traveler         | `tour-roster`    | `Roster.tsx`    |
| 4   | A traceable audit registry       | `tour-registry`  | `Registry.tsx`  |
| 5   | Only exceptions surface (alerts) | `tour-alerts`    | `Alerts.tsx`    |
| 6   | Disruption re-planning roadmap   | `tour-roadmap`   | `Roadmap.tsx`   |

Aspect 6 is framed as **"coming soon"**: disruption/re-planning is a future direction,
not the current center (see [`AGENTS.md`](../../AGENTS.md)).

## Data is all fixtures

There is no API. The operator, the trip, the ~20 travelers, their per-need guarantee
statuses, and the registry entries are static data in `data/`:

- `trip.ts`: the operator, the group trip, the travelers, and their confirmations.
- `types.ts`: `Traveler`, `Confirmation`, status/kind unions.
- `selectors.ts`: derived roll-ups (counts, per-status tallies) the sections read from.

Change a fixture and the whole dashboard re-derives; it's a showcase, not a live
product, so keep it that way (a decision recorded in `AGENTS.md`).

## Accessibility (it's the product)

- The onboarding tour is **keyboard-operable** with a focus trap and announced step
  changes; Escape and a visible close both dismiss it.
- Skip link, semantic landmarks/headings, `StatusBadge` conveys status by text + icon
  (not color alone), WCAG AA contrast, `prefers-reduced-motion` honored via Framer Motion.

## Run

```bash
# from the repo root — one dev server serves both entries
pnpm dev             # dashboard → http://localhost:5173/TripAssist/dashboard/
pnpm build           # static build → dist/ (index.html + dashboard/index.html)
pnpm typecheck
```

Scripts call `node node_modules/<pkg>/...` directly, never `npx`/`pnpm exec`; the repo
path can contain a `:` that corrupts the `.bin` PATH shim (see root
[`AGENTS.md`](../../AGENTS.md)).

## Deploy

GitHub Pages, nested under `/TripAssist/dashboard/` — the app's shared `base`
(`/TripAssist/`) is set in the root `vite.config.ts`, and this entry lives at
`dashboard/index.html`, so it resolves there automatically. If the app ever moves off
Pages (served at a domain root), flip `base` to `'/'`.

**Stack:** React 18 + Vite + Tailwind 4, Framer Motion for the tour/reveals,
`lucide-react` for icons. French-only UI, matching the landing page.
