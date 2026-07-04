// Durable store backed by Node's built-in `node:sqlite` (no native dependency).
// A document store: one row per trip holding the full AppState as JSON. This keeps
// the in-memory AppState the working set (callers mutate arbitrary nested fields)
// while giving real durability — atomic writes, WAL, no half-written JSON file — and
// a multi-trip foundation the auth/multi-tenant workstream can scope over later.
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppState } from '../shared/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// `:memory:` (tests) gets an ephemeral DB; anything else is a file path we own.
function dbPath(): string {
  return process.env.ACCESSTRIP_DB || path.join(__dirname, '..', 'data', 'accesstrip.db')
}

let db: DatabaseSync = open()

function open(): DatabaseSync {
  const file = dbPath()
  const memory = file === ':memory:'
  if (!memory) fs.mkdirSync(path.dirname(file), { recursive: true })
  const handle = new DatabaseSync(file)
  // WAL gives durable, crash-safe writes for file DBs; it's meaningless in memory.
  if (!memory) handle.exec('PRAGMA journal_mode = WAL')
  handle.exec(
    `CREATE TABLE IF NOT EXISTS trips (
       id         TEXT PRIMARY KEY,
       label      TEXT,
       state      TEXT NOT NULL,
       updated_at TEXT NOT NULL
     )`,
  )
  return handle
}

export interface TripSummary {
  id: string
  label: string
  updated_at: string
}

// Read one trip's AppState, or null if it was never saved.
export function loadTrip(id: string): AppState | null {
  const row = db.prepare('SELECT state FROM trips WHERE id = ?').get(id) as
    { state: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(row.state) as AppState
  } catch {
    return null
  }
}

// Upsert a trip's AppState. `label` is denormalized from the state for cheap listing.
export function saveTrip(id: string, state: AppState): void {
  db.prepare(
    `INSERT INTO trips (id, label, state, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET label = excluded.label,
                                   state = excluded.state,
                                   updated_at = excluded.updated_at`,
  ).run(id, state.trip?.label ?? null, JSON.stringify(state), new Date().toISOString())
}

// All trips, most-recently-updated first — for the future multi-tenant portfolio view.
export function listTrips(): TripSummary[] {
  return db
    .prepare('SELECT id, label, updated_at FROM trips ORDER BY updated_at DESC')
    .all() as unknown as TripSummary[]
}

export function deleteTrip(id: string): void {
  db.prepare('DELETE FROM trips WHERE id = ?').run(id)
}

// Close + reopen the handle. Reopening honors the current ACCESSTRIP_DB, so tests
// can point the store at a temp file, close, and reopen to prove restart-survival.
export function closeDb(): void {
  db.close()
}

export function reopenDb(): void {
  db = open()
}

export default { loadTrip, saveTrip, listTrips, deleteTrip, closeDb, reopenDb }
