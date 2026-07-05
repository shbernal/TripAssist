# AGENTS.md — TripAssist (demo showcase branch)

> Canonical orientation for anyone (human or agent) working on **`main`**.
> `CLAUDE.md` is a symlink to this file.
>
> **`main` is the static demo showcase.** It ships two zero-key, fully static apps to
> GitHub Pages and is what evaluators read. The **functional MVP lives on the `mvp`
> branch** (Express + React + Claude agents + Vapi + open-data plugins + SQLite). Don't
> reintroduce backend code, server docs, or MVP-only config here — that work belongs on
> `mvp`.

## What TripAssist is

AI trip-orchestration for travelers with disabilities. The product's job is to make
accessibility **guaranteed and traceable**, not left to the traveler to chase.

**Canonical narrative — initial reservation (proactive setup).** From the moment a trip
is booked, an AI agent secures accessibility end-to-end **before departure**: it reads
the itinerary and **proactively calls the providers** — the airport for wheelchair
assistance (WCHC) and the hotel for a roll-in shower — obtains structured confirmations,
and logs them to a registry. The traveler simply receives confirmations.

Persona: **Camille Moreau**, 34, electric wheelchair (Permobil M3). Needs: step-free
routing, roll-in shower, boarding/deboarding assistance. Trip: **Paris → Nice**.
UI/voice: **French**.

> **Disruption / re-planning is a _future_ direction, not the current center.** It's
> framed on the dashboard as a "coming soon" roadmap card. The `mvp` branch still carries
> the older reactive-disruption code as legacy-but-kept.

Accessibility is the product, not a finish: **WCAG AA**, full keyboard nav, visible
focus, `prefers-reduced-motion` honored, `aria-live` on live regions, semantic
landmarks. The demos must themselves be accessible.

## Two deliverables (both static, on this branch)

These are **two entry points of one Vite app**, not separate packages — `src/story`
renders the root `index.html`, `src/dashboard` renders `dashboard/index.html`.

1. **`src/story`** — a stylized, animated **story landing page** (root entry, served at
   `/TripAssist/`): seven scenes as a discrete slide deck (Framer Motion + Howler).
   Camille's story: agent receives the itinerary → **calls the airport** → **calls the
   hotel** → she gets **two phone notifications**. Faces are AI-generated (Codex), call
   audio voice-generated (ElevenLabs), both committed.
   **Live: <https://shbernal.github.io/TripAssist/>**.
   Own docs: [`src/story/README.md`](src/story/README.md).
2. **`src/dashboard`** — a **tour-operator dashboard** (second entry, served at
   `/TripAssist/dashboard/`): a "chief" who bought TripAssist managing a group of ~20
   seniors / travelers with disabilities on the same Paris→Nice trip. A **guided
   onboarding tour** (stepped, spotlighted reveal) walks six solution aspects — the group
   at a glance, proactive provider confirmations, per-traveler guarantee tracking, the
   traceable audit registry, exceptions & alerts, and the disruption-replanning roadmap —
   over a live-looking, **fixture-backed** (non-functional) dashboard.
   **Live: <https://shbernal.github.io/TripAssist/dashboard/>**. Data is all static
   fixtures in `src/dashboard/data/`. Camille appears as traveler #1, tying the two demos
   together (the same trip from the individual's and the operator's side).

The two entries cross-link (landing page ↔ dashboard) so evaluators find both; the links
resolve via Vite's `BASE_URL`, so they work the same in local dev and on Pages.

## Repo structure — a single app

One Vite app at the repo root with **two HTML entry points** (no pnpm workspace, no
`apps/*`). Both entries share one dependency closure and one `base` (`/TripAssist/`).

```
TripAssist/
├─ package.json            # the app: build/dev/lint/typecheck/format + asset scripts
├─ pnpm-workspace.yaml     # NOT a monorepo — settings-only (pnpm build-script allowlist)
├─ vite.config.ts          # multi-page: index.html + dashboard/index.html, base /TripAssist/
├─ tsconfig.base.json      # tsconfig.json / tsconfig.node.json extend this
├─ index.html              # story entry     → /TripAssist/            (loads src/story)
├─ dashboard/index.html    # dashboard entry → /TripAssist/dashboard/  (loads src/dashboard)
├─ public/                 # shared static assets (logo, faces, audio, scenes)
├─ src/
│  ├─ story/               # story landing page  (own README)
│  └─ dashboard/           # operator dashboard  (own README)
├─ tooling/
│  └─ demo/                # asset generators (faces via Codex + voices via ElevenLabs)
├─ .github/workflows/      # deploy-demo.yml — builds the app, publishes dist to Pages
└─ AGENTS.md / CLAUDE.md   # this file
```

## Deploy — one GitHub Pages site

Pages serves one site. `.github/workflows/deploy-demo.yml` runs `pnpm build` on every
push to `main` and publishes `dist` **as-is** — Vite already emits `index.html` at the
root and `dashboard/index.html` nested, both under `base: '/TripAssist/'`, so there's no
artifact to assemble. Flip `base` to `'/'` if ever moved off Pages (e.g. Vercel at a
domain root). No account or secret needed.

## Asset tooling (`tooling/demo/`)

- **Voices** — `generate-voices.ts`: ElevenLabs TTS per line → stitched `conversation.mp3`
  - `manifest.json` with per-line timings for caption sync. Needs `ELEVENLABS_API_KEY`.
- **Faces** — `generate-faces.ts`: Codex CLI image tool (ChatGPT OAuth, no API key) →
  photoreal PNGs from `characters.json`.
- Generated media is **committed** (`public/{faces,audio}`) so the demo runs key-free
  and deterministic. Run via the root scripts:

```bash
pnpm assets:voices   # needs ELEVENLABS_API_KEY
pnpm assets:faces    # needs `codex` on PATH
```

## Dev conventions

- **Invoke tools via `node node_modules/<pkg>/...`, never `npx`/`pnpm exec`/bare bins.**
  The working folder path can break the `node_modules/.bin` PATH shim; every script (and
  the git hooks) calls `node` directly. `pnpm` itself (corepack-managed) is safe to call.
- TypeScript **strict**, Tailwind 4, React 18, Framer Motion, flat ESLint, Prettier.
  Lefthook installs hooks on `pnpm install`: pre-commit = Prettier `--write` + ESLint
  `--fix` on staged; pre-push = `pnpm typecheck` + `pnpm lint`.

```bash
pnpm install
pnpm dev             # one Vite dev server (:5173) serving BOTH entries:
                     #   story → /TripAssist/   ·   dashboard → /TripAssist/dashboard/
pnpm build           # static build → dist/ (index.html + dashboard/index.html)
pnpm typecheck / lint / format
```

## Environment

The apps run with **zero keys**; the only key is `ELEVENLABS_API_KEY`, needed solely to
**regenerate** the landing page's call audio. Set it in a `.env` file at the repo root
(the voice generator loads it). The MVP's `ANTHROPIC_*`/`VAPI_*` keys live on the `mvp`
branch.

## Decisions already made — don't re-litigate

- **`main` is the static showcase; the functional MVP is on `mvp`.** Keep the backend,
  server docs, and MVP-only config off this branch.
- **Two static deliverables**: `src/story` (individual story) + `src/dashboard`
  (operator, guided onboarding tour). They are **two entry points of one Vite app** —
  the repo was collapsed from a pnpm workspace (`apps/story` + `apps/dashboard`) into a
  single app because the two shared ~all deps and no code. Don't reintroduce the
  workspace or per-app `apps/*` packages.
- Generated media is **committed** (zero-key, deterministic deploys); regenerate via
  `tooling/demo/`, don't gitignore `public/{faces,audio}`.
- Demos are **French-only**; transcript/UI components stay language-agnostic but no
  bilingual toggle is built.
- Demo hosting is **GitHub Pages**, one combined site; Vercel is an optional later switch.
- Dashboard data is **static fixtures** — it's a showcase, not a live product.
