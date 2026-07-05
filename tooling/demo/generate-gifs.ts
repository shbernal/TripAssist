/**
 * Records the two README / deck hero GIFs straight from the running app - no
 * manual screen capture, so they stay in sync with the real UI.
 *
 * Pipeline per clip:
 *   playwright-core drives the *system* chromium (no browser download) and
 *   records the page to webm  ->  ffmpeg extracts scaled PNG frames  ->  gifski
 *   encodes a high-quality, looping GIF into public/media/.
 *
 * Two clips:
 *   1. story.gif      - Camille's journey, walked IN ORDER at a readable pace:
 *                       hero -> itinerary -> airport call (playing) -> hotel call
 *                       (playing) -> notifications. Nothing is skipped and no
 *                       scene is flashed past.
 *   2. dashboard.gif  - the operator dashboard's guided tour stepping through its
 *                       sections, each spotlight smooth-scrolled into view.
 *
 * TUNING. Everything a re-record wants to change lives in the CONFIG block below:
 * per-clip capture viewport (the zoom - a smaller, same-aspect viewport pulls the
 * centred content in and cuts the dead top/bottom margin), the ordered story
 * BEATS with their dwell times, the dashboard step cadence, and the gifski encode
 * knobs. Re-run `pnpm assets:gifs`, eyeball public/media/*.gif, tweak, repeat.
 *
 * The story's own autopilot (static scenes dwell ~5-7s, call scenes hand off ~2s
 * after the ~33s audio ends) is always SLOWER than these beats, so the explicit
 * drive here always advances first and never desyncs.
 *
 * The script boots its own Vite dev server (the call scenes autoplay and expose
 * the `__callPlayers` hatch only in DEV) and tears it down when done.
 *
 * Requires `chromium`, `ffmpeg`, and `gifski` on PATH. Run: `pnpm assets:gifs`.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { execFile } from 'node:child_process'
import { mkdtemp, rm, mkdir, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { chromium, type Page } from 'playwright-core'

const run = promisify(execFile)

// --- CONFIG -----------------------------------------------------------------

const CHROMIUM = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium'
const PORT = 5173
const BASE = `http://localhost:${PORT}/TripAssist`
const OUT_DIR = 'public/media'

/** A capture viewport. Playwright records at the CSS-viewport pixel size, so
 *  this is both the layout viewport and the recorded resolution. Keep the aspect
 *  identical across clips (1.6) so both GIFs encode to the same shape and the
 *  deck can place them with one aspect ratio. A SMALLER viewport at that aspect
 *  is the zoom: the centred, max-width content fills more of the frame and the
 *  empty top/bottom margin shrinks. */
type Viewport = { width: number; height: number }

/** Ordered story beats. Each is a scene to land on and how long to dwell there
 *  once it is active; `playCall` nudges the DEV call-player hatch on arrival. The
 *  dwell is deliberately shorter than the app's own autopilot for that scene, so
 *  this drive stays in control. Bump a dwell to linger longer on a beat. */
type StoryBeat = { scene: StoryScene; dwellMs: number; playCall?: boolean }
type StoryScene =
  'hero' | 'itinerary' | 'airport-call' | 'hotel-call' | 'notifications' | 'outro' | 'use-cases'

const STORY = {
  // 1200x750 (aspect 1.6). Tighter than the dashboard so Camille's phone/call
  // content is pulled in and the dead vertical space is trimmed. Content is
  // designed to fit a >=720px-tall viewport, so 750 keeps it un-clipped.
  viewport: { width: 1200, height: 750 } as Viewport,
  beats: [
    { scene: 'hero', dwellMs: 2600 },
    { scene: 'itinerary', dwellMs: 3600 },
    { scene: 'airport-call', dwellMs: 6000, playCall: true },
    { scene: 'hotel-call', dwellMs: 6000, playCall: true },
    { scene: 'notifications', dwellMs: 4800 },
  ] as StoryBeat[],
}

const DASHBOARD = {
  // The dashboard is composed for the wider frame; keep the roomy viewport.
  viewport: { width: 1600, height: 1000 } as Viewport,
  steps: 6, // tour aspects (step 1 shown on load, then 5 ArrowRight presses)
  firstDwellMs: 2600, // linger on the opening "group at a glance"
  stepDwellMs: 2600, // per spotlight - slow enough to read the card + scroll
  tailDwellMs: 900, // settle on the last aspect before we cut
}

/** GIF output knobs - width/fps traded against file weight for a hero loop. GIF
 *  is 256-colour with a per-frame palette; sharpness comes from a max-quality
 *  gifski encode over a lightly-lossy, supersampled (viewport -> GIF.width)
 *  capture. lossy is gifski's LZW loss quality: HIGHER = less loss. */
const GIF = { width: 860, fps: 16, quality: 100, lossy: 96 }

// --- helpers ----------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Spawn Vite (via node, per repo convention) and resolve once it answers. */
async function startDevServer(): Promise<ChildProcess> {
  const proc = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT)], {
    stdio: 'ignore',
    env: process.env,
  })
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/`)
      if (res.ok) return proc
    } catch {
      // not up yet
    }
    await sleep(300)
  }
  proc.kill('SIGKILL')
  throw new Error('Vite dev server did not start in time')
}

/** webm -> scaled PNG frames -> single looping GIF via gifski. */
async function encodeGif(webm: string, outName: string): Promise<void> {
  const frames = await mkdtemp(join(tmpdir(), 'tripassist-frames-'))
  try {
    await run('ffmpeg', [
      '-y',
      '-i',
      webm,
      '-vf',
      // Lossless PNG frames (gifski owns the palette/dither), lanczos downscale
      // from the supersampled capture to the GIF width.
      `fps=${GIF.fps},scale=${GIF.width}:-1:flags=lanczos,format=rgb24`,
      join(frames, 'f-%04d.png'),
    ])
    // execFile runs no shell, so expand the frame list ourselves (gifski takes
    // the ordered files directly rather than a glob).
    const pngs = (await readdir(frames))
      .filter((f) => f.endsWith('.png'))
      .sort()
      .map((f) => join(frames, f))
    if (pngs.length === 0) throw new Error(`ffmpeg produced no frames from ${webm}`)
    await mkdir(OUT_DIR, { recursive: true })
    const out = join(OUT_DIR, outName)
    await run('gifski', [
      '--fps',
      String(GIF.fps),
      '--quality',
      String(GIF.quality),
      '--lossy-quality',
      String(GIF.lossy),
      '-o',
      out,
      ...pngs,
    ])
    console.log(`  wrote ${out} (${pngs.length} frames)`)
  } finally {
    await rm(frames, { recursive: true, force: true })
  }
}

// --- story drive -------------------------------------------------------------

/** The id of the story scene currently on screen (the one section not `inert`). */
function activeScene(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('main#main section[id]'))
    const active = sections.find((s) => !(s as HTMLElement).inert)
    return active?.id ?? null
  })
}

/** Nudge the DEV call-player hatch to start a call, in case headless autoplay
 *  raced the scene's own play() effect. Safe to call once on arrival. */
async function playCall(page: Page, callId: string): Promise<void> {
  await page.evaluate((id: string) => {
    const w = window as unknown as { __callPlayers?: Record<string, { play: () => void }> }
    w.__callPlayers?.[id]?.play()
  }, callId)
}

/** Press ArrowRight until the named scene is the active one (or we give up).
 *  Polls the live DOM rather than blind-pressing, so a stray autopilot advance
 *  can never make us overshoot. */
async function goToScene(page: Page, target: StoryScene): Promise<void> {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if ((await activeScene(page)) === target) return
    await page.keyboard.press('ArrowRight')
    await sleep(720) // ride out the deck's gesture lock (~620ms) before re-reading
  }
  throw new Error(`story never reached scene "${target}"`)
}

/** Walk Camille's story along the configured beats, in order, at a readable
 *  pace. No scene is skipped; each call is played and given time to breathe. */
async function captureStory(page: Page): Promise<void> {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(600) // let the hero settle before the clock starts
  for (const beat of STORY.beats) {
    await goToScene(page, beat.scene)
    if (beat.playCall) await playCall(page, beat.scene)
    await sleep(beat.dwellMs)
  }
}

// --- dashboard drive ---------------------------------------------------------

/** The guided tour stepping through the dashboard's sections, one spotlight at a
 *  time, slow enough for each card + smooth-scroll to read. */
async function captureDashboard(page: Page): Promise<void> {
  await page.goto(`${BASE}/dashboard/`, { waitUntil: 'networkidle' })
  await sleep(DASHBOARD.firstDwellMs)
  for (let i = 0; i < DASHBOARD.steps - 1; i += 1) {
    await page.keyboard.press('ArrowRight')
    await sleep(DASHBOARD.stepDwellMs)
  }
  await sleep(DASHBOARD.tailDwellMs)
}

// --- driver -----------------------------------------------------------------

async function record(
  name: string,
  viewport: Viewport,
  capture: (page: Page) => Promise<void>,
  outName: string,
): Promise<void> {
  console.log(`recording ${name} (${viewport.width}x${viewport.height})...`)
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  })
  const videos = await mkdtemp(join(tmpdir(), 'tripassist-video-'))
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: videos, size: viewport },
    reducedMotion: 'no-preference',
    colorScheme: 'dark',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  try {
    await capture(page)
  } finally {
    const video = page.video()
    await context.close() // finalizes the webm
    await browser.close()
    if (video) {
      await encodeGif(await video.path(), outName)
    }
    await rm(videos, { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  console.log('starting dev server...')
  const dev = await startDevServer()
  try {
    await record('story', STORY.viewport, captureStory, 'story.gif')
    await record('dashboard', DASHBOARD.viewport, captureDashboard, 'dashboard.gif')
  } finally {
    dev.kill('SIGKILL')
  }
  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
