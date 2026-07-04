import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { seed } from './seed'
import { loadTrip, saveTrip, listTrips, deleteTrip, closeDb, reopenDb } from './store'

// A real temp FILE DB (not :memory:) so the restart-survival test is meaningful.
const dbFile = path.join(os.tmpdir(), `accesstrip-store-test-${process.pid}.db`)

beforeAll(() => {
  process.env.ACCESSTRIP_DB = dbFile
  closeDb() // drop the :memory: handle opened at import (vitest env default)
  reopenDb() // reopen onto the temp file
})

afterAll(() => {
  closeDb()
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.rmSync(dbFile + suffix)
    } catch {
      /* best effort */
    }
  }
  delete process.env.ACCESSTRIP_DB
})

beforeEach(() => {
  for (const t of listTrips()) deleteTrip(t.id)
})

describe('store', () => {
  it('round-trips an AppState by trip id', () => {
    expect(loadTrip('camille')).toBeNull()
    saveTrip('camille', seed())
    const back = loadTrip('camille')
    expect(back).not.toBeNull()
    expect(back!.traveler.name).toBe('Camille Moreau')
    expect(back!.trip.steps).toHaveLength(7)
  })

  it('lists saved trips with their labels, newest first', () => {
    const s = seed()
    saveTrip('camille', s)
    saveTrip('marc', { ...s, trip: { ...s.trip, label: 'Lyon → Bordeaux' } })
    const trips = listTrips()
    expect(trips.map((t) => t.id).sort()).toEqual(['camille', 'marc'])
    expect(trips.find((t) => t.id === 'marc')!.label).toBe('Lyon → Bordeaux')
  })

  it('survives a restart (close + reopen the file DB)', () => {
    const s = seed()
    s.metrics.callsMade = 3
    saveTrip('camille', s)
    closeDb()
    reopenDb() // simulates a server restart on the same DB file
    const back = loadTrip('camille')
    expect(back).not.toBeNull()
    expect(back!.metrics.callsMade).toBe(3)
  })

  it('defaults ownership to demo and scopes listTrips by owner', () => {
    const s = seed()
    saveTrip('camille', s) // no owner → demo
    saveTrip('t-axa', s, 'axa')
    saveTrip('t-handi', s, 'handitour')

    expect(listTrips('demo').map((t) => t.id)).toEqual(['camille'])
    expect(listTrips('axa').map((t) => t.id)).toEqual(['t-axa'])
    // no filter → everything
    expect(
      listTrips()
        .map((t) => t.id)
        .sort(),
    ).toEqual(['camille', 't-axa', 't-handi'])
    // owner is surfaced on the summary
    expect(listTrips('axa')[0].owner).toBe('axa')
  })

  it('preserves owner on re-save (does not clobber back to demo)', () => {
    const s = seed()
    saveTrip('t-axa', s, 'axa')
    // a later default-owner save (e.g. an unrelated writer) must not steal the trip
    saveTrip('t-axa', { ...s, metrics: { ...s.metrics, callsMade: 9 } })
    expect(listTrips('axa').map((t) => t.id)).toEqual(['t-axa'])
    expect(loadTrip('t-axa')!.metrics.callsMade).toBe(9)
  })
})
