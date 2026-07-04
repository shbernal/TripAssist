import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ingestItinerary } from './ingest'

// Force the deterministic (offline) path so the test never hits a real Claude, whatever
// the ambient env. We save/restore the gating vars around each test.
const GATES = ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_VIA_CLI'] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of GATES) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})

afterEach(() => {
  for (const k of GATES) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

const SAMPLE = `Réservation TripAssist
TGV 6173 Paris → Nice, place PMR voiture 3 - 12/09 09:03
Assistance gare Paris Gare de Lyon - 12/09 08:15
Taxi adapté gare → hôtel - 12/09 15:15
Hôtel Beau Rivage, chambre accessible douche à l'italienne - 12/09 15:45
Voyageuse en fauteuil roulant électrique, besoin d'assistance embarquement.`

describe('ingest - fallback parse', () => {
  it('yields a well-formed AppState from pasted booking text', async () => {
    const { state, source } = await ingestItinerary(SAMPLE)
    expect(source).toBe('fallback')
    expect(state.trip.steps.length).toBeGreaterThan(0)
    // every step is well-formed and links into a chain
    state.trip.steps.forEach((s, i) => {
      expect(s.id).toBe(`s${i + 1}`)
      expect(s.status).toBe('identified')
      expect(s.depends_on).toEqual(i === 0 ? [] : [`s${i}`])
      expect(typeof s.title).toBe('string')
    })
  })

  it('derives a route label and accessibility needs from the text', async () => {
    const { state } = await ingestItinerary(SAMPLE)
    expect(state.trip.label).toMatch(/Paris.*Nice/)
    const needs = state.traveler.profile_functional_needs.join(' ')
    expect(needs).toMatch(/fauteuil/i)
    expect(needs).toMatch(/italienne/i)
  })

  it('produces a valid empty working state (no ledger/metrics carried in)', async () => {
    const { state } = await ingestItinerary(SAMPLE)
    expect(state.ledger).toEqual([])
    expect(state.metrics).toEqual({ minutesRecovered: 0, interventions: 0, callsMade: 0 })
    expect(state.call.status).toBe('idle')
    expect(state.replan).toBeNull()
  })

  it('rejects empty input', async () => {
    await expect(ingestItinerary('   ')).rejects.toThrow(/vide/)
  })
})
