# Demo asset tooling

Generators for the stylized landing page (`src/story`). Both write into the repo-root
`public/`. Run via `tsx` directly (the repo folder name contains `:`, which breaks the
`node_modules/.bin` PATH shim).

## Faces (Codex image tool — rides ChatGPT subscription, no API key)

Prompts live in `characters.json`; output → `public/faces/`.

```bash
node node_modules/tsx/dist/cli.mjs tooling/demo/generate-faces.ts
node node_modules/tsx/dist/cli.mjs tooling/demo/generate-faces.ts --only camille,ai-agent --force
```

Requires `codex` on PATH (`codex features list | grep image` → `image_generation … true`).

## Voices (ElevenLabs — needs `ELEVENLABS_API_KEY` in `.env`, plus `ffmpeg`/`ffprobe`)

Dialogue scripts live in `scripts/*.json`; output → `public/audio/<id>/`
(per-line MP3s, a stitched `conversation.mp3`, and `manifest.json` with caption timings).

```bash
node node_modules/tsx/dist/cli.mjs tooling/demo/generate-voices.ts
node node_modules/tsx/dist/cli.mjs tooling/demo/generate-voices.ts --only hotel-call
node node_modules/tsx/dist/cli.mjs tooling/demo/generate-voices.ts --no-stitch
```

Optional per-speaker voice overrides (else script fallbacks are used):
`ELEVENLABS_VOICE_AGENT`, `ELEVENLABS_VOICE_AIRPORT`, `ELEVENLABS_VOICE_HOTEL`.
