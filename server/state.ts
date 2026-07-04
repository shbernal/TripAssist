// In-memory state persisted to SQLite (server/store.ts). Single source of truth.
// The active trip's AppState lives in memory as the working set; every mutation is
// written back to its row. The store is a document store keyed by trip id, so this
// module owns a single active trip while the schema is ready for many.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seed } from './seed.js'
import { loadTrip, saveTrip } from './store.js'
import type {
  AppState,
  Step,
  StepStatus,
  LedgerEntry,
  AgentLogEntry,
  TranscriptChunk,
} from '../shared/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// The single trip the running MVP drives. Multi-trip scoping is the auth workstream.
const ACTIVE_TRIP_ID = 'camille'
// Legacy single-file store - imported once if present, then superseded by SQLite.
const LEGACY_STATE_FILE = path.join(__dirname, '..', 'data', 'state.json')

let state: AppState = load()

function load(): AppState {
  const persisted = loadTrip(ACTIVE_TRIP_ID)
  if (persisted) return persisted

  // First boot on the SQLite store: adopt the old data/state.json if it exists so a
  // demo in progress isn't lost, otherwise start from the seed. Either way, persist.
  const fresh = migrateLegacy() ?? seed()
  persist(fresh)
  return fresh
}

function migrateLegacy(): AppState | null {
  try {
    // An ephemeral in-memory store (tests) starts from the seed, never the legacy file.
    if (process.env.TRIPASSIST_DB === ':memory:') return null
    if (!fs.existsSync(LEGACY_STATE_FILE)) return null
    const raw = fs.readFileSync(LEGACY_STATE_FILE, 'utf8')
    if (!raw.trim()) return null
    console.log('[state] migrating legacy data/state.json into SQLite store')
    return JSON.parse(raw) as AppState
  } catch (err) {
    console.warn('[state] legacy state.json migration skipped:', (err as Error).message)
    return null
  }
}

function persist(s: AppState = state): void {
  try {
    saveTrip(ACTIVE_TRIP_ID, s)
  } catch (err) {
    console.warn('[state] persist failed:', (err as Error).message)
  }
}

export function getState(): AppState {
  return state
}

// Mutate via a function, then persist. Returns the new state.
export function updateState(mutator: (s: AppState) => void): AppState {
  mutator(state)
  persist()
  return state
}

// One-click reset to the exact seed.
export function resetState(): AppState {
  state = seed()
  persist()
  return state
}

// --- convenience mutators used across agents/routes ---

export function findStep(stepId: string): Step | undefined {
  return state.trip.steps.find((s) => s.id === stepId)
}

export function setStepStatus(
  stepId: string,
  status: StepStatus,
  extra: Partial<Step> = {},
): Step | null {
  const step = findStep(stepId)
  if (!step) return null
  step.status = status
  Object.assign(step, extra)
  persist()
  return step
}

export function appendLedger(entry: LedgerEntry): LedgerEntry {
  state.ledger.push(entry)
  persist()
  return entry
}

export function appendAgentLog(entry: AgentLogEntry): AgentLogEntry {
  state.agentLog.push(entry)
  // keep the feed bounded so a long demo doesn't balloon memory
  if (state.agentLog.length > 500) state.agentLog.splice(0, state.agentLog.length - 500)
  persist()
  return entry
}

export function appendTranscript(chunk: TranscriptChunk): TranscriptChunk {
  state.transcript.push(chunk)
  persist()
  return chunk
}

export default {
  getState,
  updateState,
  resetState,
  findStep,
  setStepStatus,
  appendLedger,
  appendAgentLog,
  appendTranscript,
}
