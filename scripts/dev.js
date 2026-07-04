// Dev launcher: spawns Express + Vite as node child processes with absolute paths.
// This deliberately avoids npm's node_modules/.bin PATH shim, because the parent
// folder name contains a ":" (PATH separator) which corrupts PATH and makes every
// local binary "command not found". Calling `node <entrypoint.js>` sidesteps that.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath

function run(label, jsPath, args = []) {
  const child = spawn(node, [jsPath, ...args], { cwd: root, stdio: 'inherit' })
  child.on('exit', (code) => {
    console.log(`\n[${label}] exited (code ${code}). Shutting down.`)
    shutdown()
  })
  return child
}

const children = []
children.push(run('SERVER', path.join(root, 'server', 'index.js')))
children.push(run('WEB', path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')))

function shutdown() {
  for (const c of children) {
    try { c.kill('SIGTERM') } catch { /* already gone */ }
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.log('\n  AccessTrip dev → API on http://localhost:3000, UI on http://localhost:5173\n')
