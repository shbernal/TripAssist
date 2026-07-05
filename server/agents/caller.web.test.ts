import { describe, it, expect, beforeEach } from 'vitest'

// The Vapi web call runs client-side; these three functions are the server relay
// that keeps the transcript in state and runs the extractor at call end (the same
// path the scripted simulation uses). Extraction falls back to the offline parse
// here since no Claude key is set in tests.

import { getState, resetState } from '../state'
import { startWebCall, pushWebChunk, endWebCall } from './caller'

describe('caller (Vapi web relay)', () => {
  beforeEach(() => {
    resetState()
  })

  it('startWebCall resets the transcript and marks a live web call', () => {
    pushWebChunk('assistant', 'ligne résiduelle')
    const before = getState().metrics.callsMade
    startWebCall()
    const s = getState()
    expect(s.transcript).toHaveLength(0)
    expect(s.call.status).toBe('in_progress')
    expect(s.call.mode).toBe('vapi-web')
    expect(s.metrics.callsMade).toBe(before + 1)
  })

  it('pushWebChunk appends finalized lines in order', () => {
    startWebCall()
    pushWebChunk('assistant', 'Bonjour, je confirme la chambre accessible ?')
    pushWebChunk('human', 'Oui, la 104 est bien réservée.')
    expect(getState().transcript.map((c) => c.speaker)).toEqual(['assistant', 'human'])
    expect(getState().transcript[1].text).toContain('104')
  })

  it('endWebCall closes the call and archives a registry confirmation', async () => {
    startWebCall()
    pushWebChunk('assistant', 'Je confirme la chambre 104 accessible ?')
    pushWebChunk('human', "Oui, douche à l'italienne, c'est confirmé.")
    const ledgerBefore = getState().ledger.length
    await endWebCall()
    const s = getState()
    expect(s.call.status).toBe('ended')
    expect(s.ledger.length).toBe(ledgerBefore + 1)
  })
})
