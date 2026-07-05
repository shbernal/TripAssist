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

<div align="center">

<video src="https://github.com/shbernal/TripAssist/raw/concept/public/media/story.mp4" autoplay loop muted playsinline width="900"></video>

**[▶ Watch the live story](https://shbernal.github.io/TripAssist/)**

</div>

_An animated story: the agent receives Camille's Paris → Nice itinerary, **calls the
airport** for boarding assistance, **calls the hotel** for a roll-in shower, and she gets
**two phone confirmations**. Nothing to arrange, nothing to explain._

### One operator, twenty travelers, every guarantee tracked.

<div align="center">

<video src="https://github.com/shbernal/TripAssist/raw/concept/public/media/dashboard.mp4" autoplay loop muted playsinline width="900"></video>

**[▶ Open the live operator dashboard](https://shbernal.github.io/TripAssist/dashboard/)**

</div>

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

## Concept and Demo branches

The project lives on two branches, each with a clear, separate job.

- **`concept`** — the **concept branch** (this branch, the default). Two polished,
  static demos that show what TripAssist does and why it matters: the story landing
  page and the operator dashboard, deployed to GitHub Pages. No backend, no keys,
  nothing to install: it just runs in a browser. This is what evaluators read.

- **`mvp`** — the **demo branch**. The same product built to actually work: Express +
  React with Claude agents that place the real provider calls (Vapi), open-data
  plugins, and a SQLite registry for the confirmations. It needs API keys and a
  running server. This is where the functional software lives, and where all future
  functional work happens.

In short: **`concept` shows the vision, `mvp` runs it.** Keeping them apart lets the
showcase stay a clean, self-contained static site while the working system evolves
independently.

Canonical narrative, repo map, and conventions: [`AGENTS.md`](AGENTS.md). Per-entry
docs: [`src/story/README.md`](src/story/README.md) ·
[`src/dashboard/README.md`](src/dashboard/README.md).
