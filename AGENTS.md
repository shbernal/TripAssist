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

1. **`apps/story`** — a stylized, animated **story landing page**: seven scenes as a
   discrete slide deck (Framer Motion + Howler). Camille's story: agent receives the
   itinerary → **calls the airport** → **calls the hotel** → she gets **two phone
   notifications**. Faces are AI-generated (Codex), call audio voice-generated
   (ElevenLabs), both committed. **Live: <https://shbernal.github.io/TripAssist/>**.
   Own docs: [`apps/story/README.md`](apps/story/README.md).
2. **`apps/dashboard`** — a **tour-operator dashboard**: a "chief" who bought TripAssist
   managing a group of ~20 seniors / travelers with disabilities on the same Paris→Nice
   trip. A **guided onboarding tour** (stepped, spotlighted reveal) walks six solution
   aspects — the group at a glance, proactive provider confirmations, per-traveler
   guarantee tracking, the traceable audit registry, exceptions & alerts, and the
   disruption-replanning roadmap — over a live-looking, **fixture-backed** (non-functional)
   dashboard. **Live: <https://shbernal.github.io/TripAssist/dashboard/>**. Data is all
   static fixtures in `apps/dashboard/src/data/`. Camille appears as traveler #1, tying
   the two demos together (the same trip from the individual's and the operator's side).

The two apps cross-link (landing page ↔ dashboard) so evaluators find both.

## Repo structure — a workspace

A pnpm **workspace**; each app has its own isolated dependency closure so they never
entangle. The root package is a **workspace manager only** (no app code at the root).

```
TripAssist/
├─ package.json            # workspace MANAGER only: aggregate build/lint/typecheck/format
├─ pnpm-workspace.yaml     # declares apps/* as members
├─ tsconfig.base.json      # apps extend this
├─ apps/
│  ├─ demo/                # story landing page  → /TripAssist/          (own README)
│  └─ dashboard/           # operator dashboard  → /TripAssist/dashboard/
├─ tooling/
│  └─ demo/                # asset generators (faces via Codex + voices via ElevenLabs)
├─ .github/workflows/      # deploy-demo.yml — builds both, publishes combined Pages site
└─ AGENTS.md / CLAUDE.md   # this file
```

## Deploy — combined GitHub Pages site

Pages serves one site. `.github/workflows/deploy-demo.yml` builds both apps on every push
to `main`, then assembles a combined artifact — `apps/story/dist` at the root,
`apps/dashboard/dist` copied into `dashboard/` — and publishes it. Each app's Vite `base`
matches its path (`/TripAssist/`, `/TripAssist/dashboard/`); flip to `'/'` / `'/dashboard/'`
if ever moved off Pages. No account or secret needed.

## Asset tooling (`tooling/demo/`)

- **Voices** — `generate-voices.ts`: ElevenLabs TTS per line → stitched `conversation.mp3`
  - `manifest.json` with per-line timings for caption sync. Needs `ELEVENLABS_API_KEY`.
- **Faces** — `generate-faces.ts`: Codex CLI image tool (ChatGPT OAuth, no API key) →
  photoreal PNGs from `characters.json`.
- Generated media is **committed** (`apps/story/public/{faces,audio}`) so the demo runs
  key-free and deterministic. Run via the root scripts:

```bash
pnpm assets:voices   # needs ELEVENLABS_API_KEY
pnpm assets:faces    # needs `codex` on PATH
```

## Dev conventions

- **Invoke tools via `node node_modules/<pkg>/...`, never `npx`/`pnpm exec`/bare bins.**
  The working folder path can break the `node_modules/.bin` PATH shim; every script (and
  the git hooks) calls `node` directly. `pnpm` itself (corepack-managed) is safe to call.
  `pnpm -r <script>` fans a script out to every workspace member.
- TypeScript **strict**, Tailwind 4, React 18, Framer Motion, flat ESLint, Prettier.
  Lefthook installs hooks on `pnpm install`: pre-commit = Prettier `--write` + per-app
  ESLint `--fix` on staged; pre-push = `pnpm -r typecheck` + `pnpm -r lint`.

```bash
pnpm install
pnpm dev             # BOTH dev servers in parallel (story :5173, dashboard :5174)
pnpm story           # story landing page dev server only
pnpm dashboard       # operator dashboard dev server only
pnpm build / typecheck / lint / format   # fan out across apps
```

## Environment

Copy `.env.example` → `.env`. The apps run with **zero keys**; the only key is
`ELEVENLABS_API_KEY`, needed solely to **regenerate** the landing page's call audio. The
MVP's `ANTHROPIC_*`/`VAPI_*` keys live on the `mvp` branch.

## Decisions already made — don't re-litigate

- **`main` is the static showcase; the functional MVP is on `mvp`.** Keep the backend,
  server docs, and MVP-only config off this branch.
- **Two static deliverables**: `apps/story` (individual story) + `apps/dashboard`
  (operator, guided onboarding tour). The dashboard is a **new workspace app**, not a
  route in the demo.
- Generated media is **committed** (zero-key, deterministic deploys); regenerate via
  `tooling/demo/`, don't gitignore `apps/story/public/{faces,audio}`.
- Demos are **French-only**; transcript/UI components stay language-agnostic but no
  bilingual toggle is built.
- Demo hosting is **GitHub Pages**, one combined site; Vercel is an optional later switch.
- Dashboard data is **static fixtures** — it's a showcase, not a live product.
