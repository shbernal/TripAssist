/**
 * generate-voices.ts - Demo asset tooling (voice generation, ElevenLabs)
 *
 * Turns the phone-call scripts (tooling/demo/scripts/*.json) into narrated audio
 * for the stylized landing page:
 *   - synthesizes each line to its own MP3 (distinct voice per speaker),
 *   - probes each clip's duration with ffprobe,
 *   - stitches the lines into one conversation track (with natural gaps) via ffmpeg,
 *   - emits a timing manifest so the frontend can sync captions + animation to audio.
 *
 * Run (folder name contains ':' → call tsx directly, not the .bin shim):
 *   node node_modules/tsx/dist/cli.mjs tooling/demo/generate-voices.ts
 *   node node_modules/tsx/dist/cli.mjs tooling/demo/generate-voices.ts --only airport-call
 *   node node_modules/tsx/dist/cli.mjs tooling/demo/generate-voices.ts --no-stitch
 *
 * Requires: ELEVENLABS_API_KEY in .env, plus `ffmpeg`/`ffprobe` on PATH.
 * Optional per-speaker voice overrides via env (referenced as ${NAME} in the scripts):
 *   ELEVENLABS_VOICE_AGENT, ELEVENLABS_VOICE_AIRPORT, ELEVENLABS_VOICE_HOTEL
 */
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')
const SCRIPTS_DIR = join(HERE, 'scripts')
const OUT_ROOT = resolve(REPO_ROOT, 'apps/demo/public/audio')

const MODEL_ID = 'eleven_multilingual_v2'
const GAP_SECONDS = 0.45 // silence inserted between lines when stitching

interface Speaker {
  name: string
  shortName?: string
  role: string
  voiceId: string
  voiceFallback?: string
  settings?: Record<string, number>
}
interface Line {
  id: number
  speaker: string
  text: string
  caption?: string
}
interface Script {
  id: string
  title: string
  locale: string
  participants: Record<string, Speaker>
  lines: Line[]
  outcome?: unknown
}

/** Minimal .env loader (avoids a dependency; only fills vars that are unset). */
function loadEnv() {
  const envPath = join(REPO_ROOT, '.env')
  if (!existsSync(envPath)) return
  for (const raw of readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const val = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}

/** Resolve ${ENV_VAR} placeholders in a voiceId, falling back to voiceFallback. */
function resolveVoiceId(sp: Speaker): string {
  const raw = sp.voiceId ?? ''
  const m = raw.match(/^\$\{([A-Z0-9_]+)\}$/)
  if (m) {
    const fromEnv = process.env[m[1]]
    if (fromEnv && fromEnv.trim()) return fromEnv.trim()
    if (sp.voiceFallback) return sp.voiceFallback
    throw new Error(`Voice for "${sp.name}" needs env ${m[1]} or a voiceFallback in the script.`)
  }
  return raw || sp.voiceFallback || ''
}

async function ffprobeDuration(file: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    file,
  ])
  return parseFloat(stdout.trim()) || 0
}

async function synthLine(
  apiKey: string,
  voiceId: string,
  text: string,
  settings: Record<string, number> | undefined,
  outPath: string,
) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: settings?.stability ?? 0.5,
        similarity_boost: settings?.similarity_boost ?? 0.75,
        style: settings?.style ?? 0.0,
        use_speaker_boost: true,
      },
    }),
  })
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text().catch(() => res.statusText)}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(outPath, buf)
}

async function stitch(clips: string[], outFile: string, workDir: string) {
  // Build a concat list with a short silence between clips.
  const silence = join(workDir, '_gap.mp3')
  await execFileAsync('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=44100:cl=mono',
    '-t',
    String(GAP_SECONDS),
    '-q:a',
    '9',
    silence,
  ])
  const listItems: string[] = []
  clips.forEach((c, i) => {
    listItems.push(`file '${c.replace(/'/g, "'\\''")}'`)
    if (i < clips.length - 1) listItems.push(`file '${silence.replace(/'/g, "'\\''")}'`)
  })
  const listFile = join(workDir, '_concat.txt')
  writeFileSync(listFile, listItems.join('\n'))
  await execFileAsync('ffmpeg', [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listFile,
    '-c:a',
    'libmp3lame',
    '-q:a',
    '4',
    outFile,
  ])
}

async function processScript(script: Script, apiKey: string, doStitch: boolean) {
  const outDir = join(OUT_ROOT, script.id)
  mkdirSync(outDir, { recursive: true })
  console.log(`\n▶ ${script.id} - ${script.title} (${script.lines.length} lines)`)

  const clips: string[] = []
  const timeline: Array<{
    id: number
    speaker: string
    caption?: string
    file: string
    start: number
    duration: number
  }> = []
  let cursor = 0

  for (const line of script.lines) {
    const sp = script.participants[line.speaker]
    if (!sp) throw new Error(`Line ${line.id} references unknown speaker "${line.speaker}"`)
    const voiceId = resolveVoiceId(sp)
    const clip = join(outDir, `${String(line.id).padStart(2, '0')}-${line.speaker}.mp3`)

    await synthLine(apiKey, voiceId, line.text, sp.settings, clip)

    const duration = await ffprobeDuration(clip)
    console.log(`  ✅ line ${line.id} [${sp.shortName ?? line.speaker}] ${duration.toFixed(2)}s`)

    timeline.push({
      id: line.id,
      speaker: line.speaker,
      caption: line.caption,
      file: `audio/${script.id}/${clip.split('/').pop()}`,
      start: cursor,
      duration,
    })
    clips.push(clip)
    cursor += duration + GAP_SECONDS
  }

  let trackFile: string | undefined
  if (doStitch) {
    const stitched = join(outDir, 'conversation.mp3')
    await stitch(clips, stitched, outDir)
    trackFile = `audio/${script.id}/conversation.mp3`
    console.log(`  🎧 stitched → ${stitched}`)
  }

  const manifest = {
    id: script.id,
    title: script.title,
    locale: script.locale,
    model: MODEL_ID,
    generatedAt: new Date().toISOString(),
    totalDuration: cursor,
    track: trackFile,
    lines: timeline,
    outcome: script.outcome,
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`  📄 manifest → ${join(outDir, 'manifest.json')}`)
}

function parseArgs(argv: string[]) {
  const only =
    argv.find((a) => a.startsWith('--only='))?.split('=')[1] ??
    (argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : undefined)
  return { only, doStitch: !argv.includes('--no-stitch') }
}

async function main() {
  loadEnv()
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.error('Missing ELEVENLABS_API_KEY (put it in .env).')
    process.exit(1)
  }
  const { only, doStitch } = parseArgs(process.argv.slice(2))

  const files = readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.json'))
  const scripts = files
    .map((f) => JSON.parse(readFileSync(join(SCRIPTS_DIR, f), 'utf8')) as Script)
    .filter((s) => !only || s.id === only)

  if (scripts.length === 0) {
    console.error(only ? `No script with id "${only}".` : 'No scripts found in ' + SCRIPTS_DIR)
    process.exit(1)
  }

  mkdirSync(OUT_ROOT, { recursive: true })
  for (const script of scripts) {
    await processScript(script, apiKey, doStitch)
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('generate-voices failed:', err)
  process.exit(1)
})
