/**
 * Records the two README hero clips straight from the running app - no manual
 * screen capture, so they stay in sync with the real UI.
 *
 * Pipeline per clip:
 *   playwright-core drives the *system* chromium (no browser download) and
 *   records the page to webm  ->  ffmpeg transcodes to a small, sharp H.264
 *   MP4 into public/media/.
 *
 * We ship MP4 rather than GIF on purpose: GIF is 256-colour with a per-frame
 * palette and no real interframe compression, so it bands the dark UI, gradients
 * and waveforms and still weighs multiple MB. H.264 keeps full colour and real
 * motion compression - sharper *and* smaller. GitHub renders <video> in the
 * README (see the embeds there).
 *
 * Two clips:
 *   1. story.mp4      - the airport call playing (waveform + synced captions +
 *                       "secured" stamps), then Camille's two phone confirmations.
 *   2. dashboard.mp4  - the operator dashboard's guided tour stepping through its
 *                       sections, each spotlight smooth-scrolled into view.
 *
 * The script boots its own Vite dev server (the call scenes autoplay and expose
 * the `__callPlayers` hatch only in DEV) and tears it down when done.
 *
 * Requires `chromium` and `ffmpeg` on PATH. Run: `pnpm assets:clips`.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { execFile } from 'node:child_process'
import { mkdtemp, rm, mkdir } from 'node:fs/promises'
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
 * downscale to CLIP.width real supersampling headroom while keeping the framing
 * the scenes are composed for.
 */
const REC = { width: 1600, height: 1000 }
/** MP4 output knobs. crf 20 is visually lossless for UI; fps matches capture. */
const CLIP = { width: 900, fps: 30, crf: 20 }

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

/** webm -> sharp, web-friendly H.264 MP4 via ffmpeg. */
async function encodeMp4(webm: string, outName: string): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true })
  const out = join(OUT_DIR, outName)
  await run('ffmpeg', [
    '-y',
    '-i',
    webm,
    '-vf',
    // Lanczos downscale from the supersampled capture; -2 keeps the height even
    // (yuv420p needs even dimensions); yuv420p for maximum player compatibility.
    `fps=${CLIP.fps},scale=${CLIP.width}:-2:flags=lanczos,format=yuv420p`,
    '-c:v',
    'libx264',
    '-crf',
    String(CLIP.crf),
    '-preset',
    'slow',
    // Interleave the moov atom up front so the clip starts playing before it has
    // fully downloaded (matters for an autoplaying README hero).
    '-movflags',
    '+faststart',
    '-an', // no audio track
    out,
  ])
  console.log(`  wrote ${out}`)
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
      await encodeMp4(await video.path(), outName)
    }
    await rm(videos, { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  console.log('starting dev server...')
  const dev = await startDevServer()
  try {
    await record('story', captureStory, 'story.mp4')
    await record('dashboard', captureDashboard, 'dashboard.mp4')
  } finally {
    dev.kill('SIGKILL')
  }
  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
