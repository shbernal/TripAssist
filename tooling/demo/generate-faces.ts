/**
 * generate-faces.ts — Demo asset tooling (image generation)
 *
 * Generates the storytelling portraits (Camille, Julien, airport & hotel staff)
 * and the AI-agent avatar for the stylized landing page, by talking directly to
 * the Codex CLI's built-in image tool. This rides the ChatGPT subscription via
 * Codex's stored OAuth login — no OpenAI API key, no per-image billing.
 * See ~/codex-image-generation.md for the underlying mechanism.
 *
 * Run (folder name contains ':' which breaks the .bin PATH shim, so call tsx directly):
 *   node node_modules/tsx/dist/cli.mjs tooling/demo/generate-faces.ts
 *   node node_modules/tsx/dist/cli.mjs tooling/demo/generate-faces.ts --only camille,ai-agent
 *   node node_modules/tsx/dist/cli.mjs tooling/demo/generate-faces.ts --force
 *
 * Requires: `codex` on PATH (verify with `codex features list | grep image`).
 */
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')

interface Character {
  id: string
  file: string
  prompt: string
}
interface Manifest {
  outputDir: string
  style: string
  characters: Character[]
  avatars: Character[]
}

function parseArgs(argv: string[]) {
  const only =
    argv.find((a) => a.startsWith('--only='))?.split('=')[1] ??
    (argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : undefined)
  return {
    force: argv.includes('--force'),
    only: only ? new Set(only.split(',').map((s) => s.trim())) : null,
  }
}

async function generateOne(char: Character, style: string, outDir: string, force: boolean) {
  const outPath = join(outDir, char.file)
  if (existsSync(outPath) && !force) {
    console.log(`  ⏭  ${char.id}: exists (use --force to regenerate) → ${outPath}`)
    return
  }
  const prompt =
    `Generate an image: ${char.prompt} ${style} ` + `Save it as ${outPath} and report the path.`

  console.log(`  🎨 ${char.id}: generating…`)
  // Codex writes into its own store, then copies to the explicit path we pin.
  await execFileAsync(
    'codex',
    ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write', '-C', outDir, prompt],
    { maxBuffer: 64 * 1024 * 1024, timeout: 5 * 60_000 },
  )
  if (existsSync(outPath)) console.log(`  ✅ ${char.id} → ${outPath}`)
  else console.warn(`  ⚠️  ${char.id}: codex ran but ${outPath} not found — check its stdout.`)
}

async function main() {
  const { force, only } = parseArgs(process.argv.slice(2))
  const manifest: Manifest = JSON.parse(readFileSync(join(HERE, 'characters.json'), 'utf8'))
  const outDir = resolve(REPO_ROOT, manifest.outputDir)
  mkdirSync(outDir, { recursive: true })

  const all = [...manifest.characters, ...manifest.avatars]
  const todo = only ? all.filter((c) => only.has(c.id)) : all
  if (todo.length === 0) {
    console.error(`No characters matched --only. Known ids: ${all.map((c) => c.id).join(', ')}`)
    process.exit(1)
  }

  console.log(`Generating ${todo.length} image(s) → ${outDir}\n`)
  for (const char of todo) {
    // Serial on purpose: codex image runs are heavy and rate-limited.
     
    await generateOne(char, manifest.style, outDir, force)
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('generate-faces failed:', err)
  process.exit(1)
})
