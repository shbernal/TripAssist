# Deploying to Fly.io

TripAssist is a single Node process (Express + the SSE hub + Vapi webhooks) that also
serves the built React front from `web/dist`. That shape needs a long-lived server, not
static hosting, so a persistent Node host is the right target. This guide covers Fly.io,
where the app is currently deployed at **https://tripassist-demo.fly.dev/**.

The app runs fully on its deterministic fallbacks, so the minimum deploy needs **zero
keys**: every demo works out of the box (including the scripted call), and live paths
(real Claude, Vapi voice, open data) light up later by adding env vars, with no code change.

---

## What ships

Three files at the repo root drive the deploy:

- **`Dockerfile`** : Node 24 base (required for the built-in `node:sqlite` store), installs
  all deps with `--ignore-scripts` (skips the git-hook `prepare`, which needs git and is
  irrelevant in production), keeps `tsx` for runtime (`pnpm start` runs the TypeScript
  server through it), and runs `pnpm build` to emit `web/dist`.
- **`fly.toml`** : one always-warm `shared-cpu-1x` / 512 MB machine in `cdg` (Paris, to
  match the French persona), a `:memory:` SQLite store (the app auto-seeds the demo trip on
  boot, so no volume is needed), and a health check on `/healthz`.
- **`.dockerignore`** : keeps `node_modules`, the local `data/` DB, and any `.env` out of
  the image.

## Prerequisites

- `flyctl` installed and logged in (`fly auth login`). On Arch: `paru -S flyctl-bin`.

## First deploy

```bash
fly apps create tripassist-demo                 # free; no machine until deploy
fly secrets set SESSION_SECRET="$(openssl rand -hex 32)" --app tripassist-demo --stage
fly deploy --remote-only --app tripassist-demo  # remote build, no local Docker needed
fly scale count 1 --app tripassist-demo         # Fly defaults to 2 (HA); one is enough
```

`SESSION_SECRET` signs operator session cookies (`server/auth.ts`). It has a stable dev
default, but a real value is required for any shared instance.

Verify:

```bash
curl -s https://tripassist-demo.fly.dev/healthz   # {"ok":true,"steps":7}
```

Redeploys after a code change are just `fly deploy --remote-only --app tripassist-demo`.

## Cost

One always-on `shared-cpu-1x` / 512 MB machine is about **$3.32/month**, plus negligible
bandwidth and no volume (the `:memory:` store). Fly has no free tier, so a card is required
and small balances are billed, not waived. Note that `fly deploy` provisions **two**
machines by default for high availability; `fly scale count 1` drops that to one (and halves
the bill) for a demo.

## Going live with keys

Two kinds of config, and the distinction matters:

**Runtime secrets** (injected at boot, set once, auto-restart the machine, no rebuild):

```bash
# Real Claude reasoning (planner / extractor / vision / ingest)
fly secrets set ANTHROPIC_API_KEY=sk-ant-... --app tripassist-demo

# Real outbound phone + webhooks
fly secrets set VAPI_API_KEY=... VAPI_PHONE_NUMBER_ID=... VAPI_ASSISTANT_ID=... \
  PUBLIC_URL=https://tripassist-demo.fly.dev --app tripassist-demo
# then point the Vapi dashboard webhook at https://tripassist-demo.fly.dev/webhooks/...
```

**Build-time args** (baked into the client bundle by Vite, so they need a redeploy, not a
secret). Without them the in-browser Vapi call falls back to the scripted simulation. The
public key is safe to embed in client JS:

```bash
fly deploy --remote-only --app tripassist-demo \
  --build-arg VITE_VAPI_PUBLIC_KEY=... \
  --build-arg VITE_VAPI_ASSISTANT_ID=...
```

The phone-call runbook (Vapi account, assistant, webhook) is in
[`vapi-setup.md`](vapi-setup.md).

## Persistence (optional)

The demo uses a `:memory:` store that resets on restart. For durable state, attach a volume
and point the DB at it:

```bash
fly volumes create data --size 1 --region cdg --app tripassist-demo   # ~$0.15/GB/month
```

Then in `fly.toml` set `TRIPASSIST_DB = "/data/tripassist.db"` and add a `[[mounts]]` block
(`source = "data"`, `destination = "/data"`), and redeploy.
