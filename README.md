# AccessTrip

AI trip-orchestration platform for disabled travelers. Hackathon demo — one traveler
(Camille Moreau), one trip (Paris → Nice), live-updated over SSE.

Build proceeds milestone by milestone (M1 → M6). See `SPEC.md`.

## Status

- **M1 (spine)** ✅ — Express + SSE + seed + traveler timeline + ops layout + demo panel with Reset.
- **M2 (chaos cascade)** ✅ — watchdog + chaos button + planner (Claude w/ hardcoded fallback) + at-risk cascade with reason chips + replan card + apply. Flow A runs end-to-end offline.
- **M3 (voice)** ✅ — caller (real Vapi + offline simulation) + `/webhooks/vapi` + live transcript CallPanel (aria-live bubbles).
- **M4 (extraction)** ✅ — extractor (Claude w/ keyword fallback) on call end → ledger archive → s5 flip → escalation + pre-seeded Hôtel Aston recovery. Flow B runs end-to-end offline via the simulated call.
- **M5 (aces)** ✅ — vision verdict card (Claude vision w/ fallback) + replica PRM form at `/prm-form` + headed Playwright autofill.
- **M6 (hardening)** ✅ — force-step overrides in the demo panel (manual override for any step/status), aria-live on all live regions, keyboard-operable, WCAG AA.

### Post-milestone enhancements

- **Voix live** ✅ — the simulated call is spoken aloud in a French voice (Web Speech API), a distinct voice for the AI vs. the receptionist, with a mute toggle.
- **Sprint 1 (storytelling)** ✅ — impact-metrics KPI band (incidents caught, remediations applied, minutes recovered, calls made, accessibility held, all live); a catalogue of **5 disruption scenarios** (`server/scenarios.js`: TGV delay, SNCF strike, PMR elevator down, storm, taxi cancelled), each with its own cascade + accessibility-safe remediation; and animations on status changes, bubbles, chips, and KPI updates (reduced-motion aware).
- **Sprint 2 (visible reasoning)** ✅ — the **agent orchestra** (`web/src/ops/AgentGraph.jsx`): five agent nodes (Veille, Planificateur, Appelant, Extracteur, Vision) that light up and pulse as they work, plus a live reasoning stream showing each agent's chain of thought. Backed by `server/agents/trace.js` (`agent_state` + `agent_reasoning` SSE events) woven through the watchdog, planner, caller, extractor, and vision agents.

### Live vs. offline

The demo runs **fully offline** with no keys: the planner/extractor/vision agents fall back to deterministic results, and `/api/call/start` plays a scripted call over the same SSE pipeline. To go live, fill `AccessTrip/.env`:
- `ANTHROPIC_API_KEY` (direct key, sent as `x-api-key`) **or** `ANTHROPIC_AUTH_TOKEN` + `ANTHROPIC_BASE_URL` (gateway/OAuth, sent as `Authorization: Bearer`) — real Claude planning / extraction / vision.
- `VAPI_*` + `RECEPTIONIST_PHONE` + `PUBLIC_URL` (ngrok) — a real phone call with streamed transcript. Full walkthrough in **[VAPI_SETUP.md](VAPI_SETUP.md)**.

### Autofill (M5) — one-time setup

Playwright is installed as a devDependency. If the browser binary is missing, install it (use this, not `npx` — the folder name's `:` breaks the PATH shim):

```bash
npm run pw:install
```

Without the browser, the autofill button reports "Playwright non installé" and nothing else breaks.

## Run

```bash
npm install
npm run dev        # Express (3000) + Vite (5173) with HMR
# open http://localhost:5173
```

Single-process / production mode:

```bash
npm run build      # emits web/dist
npm start          # Express serves API + built frontend on :3000
```

Smoke check (server must be running):

```bash
npm run smoke
```

## Views

- `/` — traveler timeline in a phone frame + accessibility passport.
- `/ops` — control center: step watchlist, agent log, confirmation ledger.
- `/demo` — presenter panel: **Reset** (one-click return to seed).

## Accessibility

French UI, semantic landmarks, `aria-live="polite"` on timeline / watchlist / agent log,
keyboard-operable steps, visible focus, reduced-motion aware. Built to be demoed with VoiceOver.

## Config

Copy `.env.example` → `.env`. Only needed from M3 (Vapi) onward; M1/M2 run with no keys.
