# TripAssist — story landing page (`src/story`)

A stylized, animated **story landing page** telling Camille's trip-setup story. Static,
no backend, no login, zero keys — all AI-generated media (faces, call audio) is committed.

This is the **root entry** (`index.html`) of the single TripAssist app; the operator
[dashboard](../dashboard/) is the second entry. See the root
[`AGENTS.md`](../../AGENTS.md) for the repo shape.

**Live: <https://shbernal.github.io/TripAssist/>** — auto-deployed by
[`.github/workflows/deploy-demo.yml`](../../.github/workflows/deploy-demo.yml) on every
push to `main`.

The narrative (canonical in [`AGENTS.md`](../../AGENTS.md)): an AI agent receives
Camille's itinerary, **calls the airport** for wheelchair assistance (WCHC), **calls the
hotel** for a roll-in shower, and Camille receives **two phone notifications** confirming
both — accessibility secured proactively, before departure.

> Paths below are relative to this directory (`src/story/`).

## How the story is built

The story is a **discrete slide deck**, not free scrolling: seven scenes on one track
(sideways on wide screens, stacked vertically on mobile), exactly one active at a time.
Every wheel notch, swipe, arrow key, or nav dot moves one whole scene — navigation is
predictable and never strands the viewer mid-transition. The story also advances on its
own (static scenes dwell a few seconds, call scenes hand off when their audio ends); any
user gesture cancels the pending auto-advance. See `story/Story.tsx` and
`lib/useStoryDeck.ts`.

> Historical note: the original plan was GSAP + Lenis scroll-pinned "scrollytelling".
> The deck model replaced it because whole-scene steps are more predictable for keyboard
> and screen-reader users and never trap focus mid-animation.

Scene order (`story/flow.ts`):

| #   | Scene           | File                                | Beat                                                              |
| --- | --------------- | ----------------------------------- | ----------------------------------------------------------------- |
| 1   | `hero`          | `story/scenes/01-Hero.tsx`          | Camille portrait + tagline                                        |
| 2   | `itinerary`     | `story/scenes/02-Itinerary.tsx`     | Itinerary lands in the agent's inbox; parsed into step chips      |
| 3   | `airport-call`  | `story/scenes/03-AirportCall.tsx`   | Call stage → CDG assistance; WCHC confirmed chip                  |
| 4   | `hotel-call`    | `story/scenes/04-HotelCall.tsx`     | Call stage → hotel; tension beat (bathtub ⚠️ → roll-in shower ✅) |
| 5   | `notifications` | `story/scenes/05-Notifications.tsx` | Two iOS-style banners land on Camille's phone                     |
| 6   | `outro`         | `story/scenes/06-Outro.tsx`         | Registry seals the confirmations; CTA                             |
| 7   | `use-cases`     | `story/scenes/07-UseCases.tsx`      | Broader use cases — the deck's resting state                      |

The `#` column is the file order. On screen the hero is an unnumbered intro, so the
step badge in the corner counts the six scenes after it (01–06), not 01–07.

**Stack actually in use:** React 18 + Vite + Tailwind 4, **Framer Motion** for all scene
and component animation, **Howler** for call audio, `lucide-react` for icons. The
waveform is a bespoke CSS-bar visual driven by the audio player — one audio engine, no
dual-decode sync (wavesurfer.js was considered and dropped).

**Caption/animation sync:** each call's `public/audio/<id>/manifest.json` (the shared
`public/` at the repo root) carries `lines[]` with `{start, duration, caption, speaker}`
(timings probed at generation via `ffprobe`). `lib/useCallPlayer.ts` plays
`conversation.mp3` and derives the active caption and "speaking" avatar purely from
`currentTime` — no manual timing anywhere.

## Accessibility (non-negotiable — it's the product)

- `prefers-reduced-motion` gates every motion path (`lib/useReducedMotion.ts`).
- Captions are real DOM text with `aria-live`; every call has a full transcript in the
  DOM. Audio is opt-in via a visible play/mute control; captions work with sound off.
- Non-active scenes are `inert` — in the DOM but out of the tab order and hidden from
  assistive tech, so focus can never land on an off-screen control.
- Skip link, `:focus-visible`, semantic `section`/heading outline, WCAG AA contrast,
  alt text on every face.
- Lighthouse a11y **100/100** (2026-07-04, production build). Caveat: Lighthouse only
  grades the initial state; scenes 2–7 rely on the manual reduced-motion / keyboard /
  transcript passes above — re-run those when touching scene logic.

## Run

```bash
# from the repo root — one dev server serves both entries
pnpm dev             # story → http://localhost:5173/TripAssist/
pnpm build           # static build → dist/ (index.html + dashboard/index.html)
pnpm typecheck
```

Scripts call `node node_modules/<pkg>/...` directly, never `npx`/`pnpm exec` — the repo
path can contain a `:` that corrupts the `.bin` PATH shim (see root `AGENTS.md`).

## Deploy

GitHub Pages, at `/TripAssist/` — the app's shared `base` is set in the root
`vite.config.ts`, not on the CLI. If this ever moves to Vercel (served at a domain root),
flip `base` to `'/'` there.

## Assets

The repo-root `public/faces/` and `public/audio/` are **generated and committed** so the
demo deploys key-free and deterministic. Regeneration (Codex for faces, ElevenLabs for
voices) lives in [`tooling/demo/`](../../tooling/demo/README.md); dialogue scripts
(French, with the `outcome` block that feeds the notifications scene) live in
`tooling/demo/scripts/`.

The demo is **French-only** by decision (persona-true audio + captions). The transcript
components are language-agnostic, so an EN track could be added later — but no bilingual
toggle is built.
