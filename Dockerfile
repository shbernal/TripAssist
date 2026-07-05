# syntax=docker/dockerfile:1
# TripAssist — single Node process (Express + SSE + Vapi webhooks) that also
# serves the built React front (web/dist). Node 24 is required for the built-in
# `node:sqlite` store used by server/store.ts.
FROM node:24-slim

# pnpm via corepack; version is pinned by package.json "packageManager".
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Install deps first for better layer caching. We deliberately keep ALL deps:
# vite is needed to build the front, and tsx is needed AT RUNTIME (`pnpm start`
# runs the TypeScript server through tsx), so we must NOT prune devDependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts skips the root `prepare` (lefthook git-hook install, which
# needs git and is irrelevant in a production image).
RUN pnpm install --frozen-lockfile --ignore-scripts

# App source
COPY . .

# VITE_* vars are baked into the client bundle at BUILD time (not runtime). They
# are optional: without them the in-browser Vapi call cleanly falls back to the
# scripted simulation. The public key is safe to embed in client JS. Provide via:
#   fly deploy --build-arg VITE_VAPI_PUBLIC_KEY=... --build-arg VITE_VAPI_ASSISTANT_ID=...
ARG VITE_VAPI_PUBLIC_KEY=""
ARG VITE_VAPI_ASSISTANT_ID=""
ENV VITE_VAPI_PUBLIC_KEY=$VITE_VAPI_PUBLIC_KEY
ENV VITE_VAPI_ASSISTANT_ID=$VITE_VAPI_ASSISTANT_ID

# Build the React front → web/dist, which Express serves in the same process.
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "start"]
