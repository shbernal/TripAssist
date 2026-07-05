<div align="center">

# TripAssist

### Accessible travel that is **guaranteed and traceable**, not something the traveler has to chase.

TripAssist is an AI agent that secures accessibility end-to-end **before departure**. The
moment a trip is booked, it reads the itinerary and **calls the providers itself**: the
airport for wheelchair assistance, the hotel for a roll-in shower. It gets structured
confirmations and logs every one. The traveler just gets the good news.

**[▶ See Camille's story](https://shbernal.github.io/TripAssist/)** &nbsp;·&nbsp; **[▶ Open the operator dashboard](https://shbernal.github.io/TripAssist/dashboard/)**

</div>

---

### The agent makes the calls. Camille just gets confirmations.

[![The story: the agent calls the airport, then Camille receives two phone confirmations](./public/media/story.gif)](https://shbernal.github.io/TripAssist/)

_An animated story: the agent receives Camille's Paris → Nice itinerary, **calls the
airport** for boarding assistance, **calls the hotel** for a roll-in shower, and she gets
**two phone confirmations**. Nothing to arrange, nothing to explain._

### One operator, twenty travelers, every guarantee tracked.

[![The operator dashboard: a guided tour across the group overview, proactive confirmations, per-traveler tracking, and the audit registry](./public/media/dashboard.gif)](https://shbernal.github.io/TripAssist/dashboard/)

_A tour operator managing ~20 seniors and travelers with disabilities on the same trip. A
guided tour walks the group at a glance, the proactive provider confirmations, per-traveler
guarantee tracking, and a **traceable audit registry**. Camille is traveler #1, tying the
two views together._

---

## Why it matters

Today, accessible travel runs on the traveler's own labor: a chain of phone calls to
airlines, airports, and hotels, each repeated, none of it guaranteed, and no proof at the
other end. A single dropped confirmation can strand someone at a gate or in a room they
cannot use.

TripAssist flips that around:

- **Proactive.** The agent secures accessibility from the moment of booking, before
  departure, without waiting to be asked.
- **Guaranteed.** Every need is tracked to a confirmed outcome, not left as a hopeful
  request.
- **Traceable.** Each confirmation is logged with provider, reference, and timestamp.
  Accessibility becomes provable, not just promised.

Persona: **Camille Moreau**, 34, electric wheelchair. Trip: **Paris → Nice**. UI and voice
in **French**.

## Accessibility is the product

Not a finishing touch: the demos are themselves accessible. **WCAG AA**, full keyboard
navigation, visible focus, `prefers-reduced-motion` honored, `aria-live` on live regions,
semantic landmarks. The story page scores **Lighthouse a11y 100/100**; the dashboard tour
is keyboard-operable with a focus trap and announced step changes.

## The two demos

| Demo                                     | What it is                                                                   | Live                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Story landing page** (`src/story`)     | An animated, seven-scene story of a single trip from the traveler's side.    | **<https://shbernal.github.io/TripAssist/>**           |
| **Operator dashboard** (`src/dashboard`) | A tour operator's fixture-backed control room with a guided onboarding tour. | **<https://shbernal.github.io/TripAssist/dashboard/>** |

Both are **static, zero-key, and deterministic**: all AI-generated media (faces, call
audio) is committed, so they build and deploy with no secrets. The two cross-link so you
can move between the individual story and the operator view.

---

## For builders

### Run & build

One Vite app with two HTML entry points (`index.html` for the story, `dashboard/index.html`
for the dashboard), one shared base `/TripAssist/`. Tooling is invoked via
`node node_modules/<pkg>/...` (the repo path can contain a `:` that corrupts the
`node_modules/.bin` PATH shim, so `npx` / `pnpm exec` / bare bins are avoided everywhere,
including the git hooks).

```bash
pnpm install
pnpm dev          # dev server on :5173 (story at /, dashboard at /dashboard/)
pnpm build        # static build -> dist/ (published as-is)
pnpm typecheck
pnpm lint
pnpm format
```

Deeper per-entry docs: [`src/story/README.md`](src/story/README.md) ·
[`src/dashboard/README.md`](src/dashboard/README.md). Canonical narrative, repo map, and
conventions: [`AGENTS.md`](AGENTS.md).

### Regenerating the media

All demo media is committed so nothing is needed to run. To regenerate it:

```bash
pnpm assets:faces   # AI faces via the Codex CLI (ChatGPT OAuth, no API key)
pnpm assets:voices  # call audio via ElevenLabs (needs ELEVENLABS_API_KEY)
pnpm assets:gifs    # the two README GIFs, recorded from the running app
```

`assets:gifs` drives the system `chromium` with `playwright-core`, records each clip to
video, and encodes it with `ffmpeg` + `gifski` (all three must be on `PATH`).

### Deploy

GitHub Pages serves one site. [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml)
runs `pnpm build` on every push to `concept` and publishes `dist` as-is (Vite emits the story
at the root and the dashboard nested, both under `base: '/TripAssist/'`). No account or
secret needed.

### Branch split

- **`concept`** (this branch, the default): the static demo showcase (`src/story` +
  `src/dashboard`), deployed to GitHub Pages. No backend, no keys.
- **`mvp`**: the functional MVP (Express + React with Claude agents, Vapi phone calls,
  open-data plugins, and SQLite). Same product narrative, different runtime. All future
  _functional_ work happens there; `concept` stays a clean, self-contained static demo.
