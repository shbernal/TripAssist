# TripAssist — Documentation

AI trip-orchestration platform for disabled travelers. Start with the root
[`README.md`](../README.md) for setup and run instructions; this folder holds the
deeper product and technical docs. The canonical narrative (proactive
initial-reservation) lives in [`AGENTS.md`](../AGENTS.md); the stylized demo is live
at <https://shbernal.github.io/TripAssist/>. Docs marked with a ⚠️ banner predate
the pivot — their technical content holds, their narrative is superseded.

## Product

- [Brief](product/brief.md) — vision, scope, and the demo narrative.
- [Demo Runbook](product/demo-runbook.md) — step-by-step script for presenting the demo.

## Architecture

- [Architecture](architecture/ARCHITECTURE.md) — **the current technical map** (FR): diagram, agents, plugins, real-vs-demo table, how to verify.
- [Data Model](architecture/data-model.md) — data dictionary: entities, reference master data (real UIC/IATA codes), integrity invariants, data sources.
- [Spec](architecture/spec.md) — ⚠️ original build spec (milestones M1–M6, disruption-centric).

## Guides

- [Vapi Setup](guides/vapi-setup.md) — configuring a real phone call with streamed transcript.

## App-local docs

- [`apps/demo/README.md`](../apps/demo/README.md) — the demo landing page: deck architecture, scenes, a11y, deploy.
- [`tooling/demo/README.md`](../tooling/demo/README.md) — regenerating the demo's faces (Codex) and call audio (ElevenLabs).
