import { describe, it, expect } from 'vitest'
import { seed } from './seed'
import { validateAppState } from './validate'
import { STATIONS, CLIENTS, CATEGORY_SSR, ssrForCategory } from '../shared/reference'

describe('data integrity', () => {
  it('the seeded state satisfies every invariant', () => {
    expect(validateAppState(seed())).toEqual([])
  })

  it('catches broken references, duplicate refs and unknown clients', () => {
    const s = seed()
    s.trip.steps[2].depends_on = ['does-not-exist']
    s.trip.steps[3].ref = s.trip.steps[0].ref // duplicate reference
    s.ledger.push({ step: 'nope', confirmed_by: 'x', channel: 'x', at: 'x', ref: 'Z' })
    s.fleet[0].client = 'Client Inconnu SARL'
    const issues = validateAppState(s)
    expect(issues.some((i) => i.includes('does-not-exist'))).toBe(true)
    expect(issues.some((i) => i.includes('dupliquée'))).toBe(true)
    expect(issues.some((i) => i.includes('registre'))).toBe(true)
    expect(issues.some((i) => i.includes('Client hors référentiel'))).toBe(true)
  })
})

describe('reference master data', () => {
  it('every fleet client exists in the client registry', () => {
    for (const f of seed().fleet) {
      expect(CLIENTS[f.client], `client absent du référentiel: ${f.client}`).toBeTruthy()
    }
  })

  it('every fleet category maps to at least one SSR code', () => {
    for (const f of seed().fleet) {
      expect(f.category in CATEGORY_SSR, `catégorie non mappée: ${f.category}`).toBe(true)
      expect(ssrForCategory(f.category).length).toBeGreaterThan(0)
    }
  })

  it('every station carries a valid 8-digit UIC code', () => {
    for (const s of Object.values(STATIONS)) {
      expect(s.uic).toMatch(/^\d{8}$/)
    }
  })
})
