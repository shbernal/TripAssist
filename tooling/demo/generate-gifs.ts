/**
 * Records the two README hero GIFs straight from the running app - no manual
 * screen capture, so they stay in sync with the real UI.
 *
 * Pipeline per clip:
 *   playwright-core drives the *system* chromium (no browser download) and
 *   records the page to webm  ->  ffmpeg extracts scaled PNG frames  ->  gifski
 *   encodes a high-quality, looping GIF into public/media/.
 *
 * Two clips:
 *   1. story.gif      - the airport call playing (waveform + synced captions +
 *                       "secured" stamps), then Camille's two phone confirmations.
 *   2. dashboard.gif  - the operator dashboard's guided tour stepping through its
 *                       sections, each spotlight smooth-scrolled into view.
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

// --- config -----------------------------------------------------------------

const CHROMIUM = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium'
const PORT = 5173
const BASE = `http://localhost:${PORT}/TripAssist`
const OUT_DIR = 'public/media'

/**
 * Record size. Playwright captures the video at the CSS-viewport pixel size
 * (deviceScaleFactor does NOT raise video resolution - it only pads), so this
 * is both the layout viewport and the recorded resolution. 1600x1000 gives the
 * downscale to GIF.width real supersampling headroom while keeping the framing
 * the scenes are composed for.
 */
const REC = { width: 1600, height: 1000 }
/** GIF output knobs - width/fps traded against file weight for a README hero. */
const GIF = { width: 900, fps: 18, quality: 90, lossy: 78 }

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
      // Lossless PNG frames (gifski owns the palette/dither), full-range colour,
      // lanczos downscale from the SCALE x supersampled capture.
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
      // Lossy compression keeps the README hero light; the higher capture
      // resolution (REC -> GIF.width supersample) carries the sharpness.
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

/** Advance the story deck by one scene and wait out the gesture lock. */
async function nextScene(page: Page): Promise<void> {
  await page.keyboard.press('ArrowRight')
  await sleep(750)
}

// --- clips ------------------------------------------------------------------

/** hero -> itinerary -> airport-call (playing) -> notifications. */
async function captureStory(page: Page): Promise<void> {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(800)
  await nextScene(page) // itinerary
  await nextScene(page) // airport-call

  // The scene autoplays on arrival; nudge the DEV hatch too in case it raced the
  // 'ready' state, then let the call animate (waveform, captions, stamps).
  await page.evaluate(() => {
    const w = window as unknown as {
      __callPlayers?: Record<string, { play: () => void }>
    }
    w.__callPlayers?.['airport-call']?.play()
  })
  await sleep(7000)

  await nextScene(page) // hotel-call (passed through)
  await nextScene(page) // notifications
  await sleep(4200) // let both phone alerts settle in
}

/** The guided tour stepping through the dashboard's six sections. */
async function captureDashboard(page: Page): Promise<void> {
  await page.goto(`${BASE}/dashboard/`, { waitUntil: 'networkidle' })
  await sleep(1600) // step 1: the group at a glance
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press('ArrowRight')
    await sleep(1700) // dwell so the spotlight + smooth-scroll reads
  }
  await sleep(600)
}

// --- driver -----------------------------------------------------------------

async function record(
  name: string,
  capture: (page: Page) => Promise<void>,
  outName: string,
): Promise<void> {
  console.log(`recording ${name}...`)
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  })
  const videos = await mkdtemp(join(tmpdir(), 'tripassist-video-'))
  const context = await browser.newContext({
    viewport: REC,
    recordVideo: { dir: videos, size: REC },
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
    await record('story', captureStory, 'story.gif')
    await record('dashboard', captureDashboard, 'dashboard.gif')
  } finally {
    dev.kill('SIGKILL')
  }
  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
