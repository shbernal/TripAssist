import type { Confirmation, ConfirmationStatus, Traveler } from './types'
import { travelers } from './trip'

// A traveler's overall guarantee status is the worst of their confirmations:
// one unresolved row means the trip is not yet fully guaranteed for them.
const RANK: Record<ConfirmationStatus, number> = {
  confirmed: 0,
  pending: 1,
  attention: 2,
}

export function travelerStatus(t: Traveler): ConfirmationStatus {
  return t.confirmations.reduce<ConfirmationStatus>(
    (worst, c) => (RANK[c.status] > RANK[worst] ? c.status : worst),
    'confirmed',
  )
}

export interface StatusCounts {
  confirmed: number
  pending: number
  attention: number
  total: number
}

export const travelerCounts: StatusCounts = travelers.reduce<StatusCounts>(
  (acc, t) => {
    acc[travelerStatus(t)] += 1
    acc.total += 1
    return acc
  },
  { confirmed: 0, pending: 0, attention: 0, total: 0 },
)

export const confirmationCounts: StatusCounts = travelers
  .flatMap((t) => t.confirmations)
  .reduce<StatusCounts>(
    (acc, c) => {
      acc[c.status] += 1
      acc.total += 1
      return acc
    },
    { confirmed: 0, pending: 0, attention: 0, total: 0 },
  )

/** A confirmation flattened with its traveler: the audit-registry row shape. */
export interface RegistryEntry extends Confirmation {
  travelerId: string
  travelerName: string
}

/** Every logged guarantee, newest first: the traceable registry. */
export const registry: RegistryEntry[] = travelers
  .flatMap((t) =>
    t.confirmations.map((c) => ({
      ...c,
      travelerId: t.id,
      travelerName: t.name,
    })),
  )
  .sort((a, b) => b.reference.localeCompare(a.reference))

/** Travelers with anything not yet confirmed: the exceptions panel. */
export const alerts = travelers
  .filter((t) => travelerStatus(t) !== 'confirmed')
  .map((t) => ({
    traveler: t,
    status: travelerStatus(t),
    issues: t.confirmations.filter((c) => c.status !== 'confirmed'),
  }))
  // attention before pending
  .sort((a, b) => RANK[b.status] - RANK[a.status])
