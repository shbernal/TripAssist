// In-memory state with lightweight JSON persistence. Single source of truth.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seed } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, '..', 'data', 'state.json')

let state = load()

function load() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8')
      if (raw.trim()) return JSON.parse(raw)
    }
  } catch (err) {
    console.warn('[state] could not load persisted state, seeding fresh:', err.message)
  }
  const fresh = seed()
  persist(fresh)
  return fresh
}

function persist(s = state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
    fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
  } catch (err) {
    console.warn('[state] persist failed:', err.message)
  }
}

export function getState() {
  return state
}

// Mutate via a function, then persist. Returns the new state.
export function updateState(mutator) {
  mutator(state)
  persist()
  return state
}

// One-click reset to the exact seed.
export function resetState() {
  state = seed()
  persist()
  return state
}

// --- convenience mutators used across agents/routes ---

export function findStep(stepId) {
  return state.trip.steps.find((s) => s.id === stepId)
}

export function setStepStatus(stepId, status, extra = {}) {
  const step = findStep(stepId)
  if (!step) return null
  step.status = status
  Object.assign(step, extra)
  persist()
  return step
}

export function appendLedger(entry) {
  state.ledger.push(entry)
  persist()
  return entry
}

export function appendAgentLog(entry) {
  state.agentLog.push(entry)
  // keep the feed bounded so a long demo doesn't balloon memory
  if (state.agentLog.length > 500) state.agentLog.splice(0, state.agentLog.length - 500)
  persist()
  return entry
}

export function appendTranscript(chunk) {
  state.transcript.push(chunk)
  persist()
  return chunk
}

export default { getState, updateState, resetState, findStep, setStepStatus, appendLedger, appendAgentLog, appendTranscript }
