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
       owner      TEXT DEFAULT 'demo',
       updated_at TEXT NOT NULL
     )`,
  )
  // Migration for DBs created before ownership existed: add the column and back-fill
  // existing rows to the demo tenant so the additive auth model holds.
  const cols = handle.prepare('PRAGMA table_info(trips)').all() as Array<{ name: string }>
  if (!cols.some((c) => c.name === 'owner')) {
    handle.exec("ALTER TABLE trips ADD COLUMN owner TEXT DEFAULT 'demo'")
  }
  return handle
}

export interface TripSummary {
  id: string
  label: string
  owner: string
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

// Upsert a trip's AppState. `label` is denormalized from the state for cheap listing;
// `owner` scopes the trip to a tenant. Omit `owner` to preserve the existing tenant on
// re-save (new trips then default to demo), so callers that don't care about ownership —
// e.g. the single-trip demo writer — never accidentally reassign a trip.
export function saveTrip(id: string, state: AppState, owner?: string): void {
  let finalOwner = owner
  if (finalOwner === undefined) {
    const row = db.prepare('SELECT owner FROM trips WHERE id = ?').get(id) as
      { owner?: string } | undefined
    finalOwner = row?.owner ?? 'demo'
  }
  db.prepare(
    `INSERT INTO trips (id, label, state, owner, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET label = excluded.label,
                                   state = excluded.state,
                                   owner = excluded.owner,
                                   updated_at = excluded.updated_at`,
  ).run(id, state.trip?.label ?? null, JSON.stringify(state), finalOwner, new Date().toISOString())
}

// Trips, most-recently-updated first. Pass an owner to scope to one tenant's portfolio;
// omit it to list everything (admin/testing).
export function listTrips(owner?: string): TripSummary[] {
  if (owner) {
    return db
      .prepare(
        'SELECT id, label, owner, updated_at FROM trips WHERE owner = ? ORDER BY updated_at DESC',
      )
      .all(owner) as unknown as TripSummary[]
  }
  return db
    .prepare('SELECT id, label, owner, updated_at FROM trips ORDER BY updated_at DESC')
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
