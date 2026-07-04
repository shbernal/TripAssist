// Shared shapes for the operator-dashboard fixtures. Everything here is static
// demo data — no backend — but typed as if it came from the registry the MVP
// writes to, so the "guaranteed and traceable" story reads honestly.

export type ConfirmationStatus = 'confirmed' | 'pending' | 'attention'

export type ConfirmationKind = 'airport' | 'hotel' | 'transfer'

/** One logged accessibility guarantee for one traveler on one leg of the trip. */
export interface Confirmation {
  kind: ConfirmationKind
  /** Short human label, e.g. "Assistance WCHC — CDG". */
  label: string
  /** Who confirmed it (the provider the agent called). */
  provider: string
  status: ConfirmationStatus
  /** What exactly was secured, e.g. "Douche à l'italienne, chambre PMR". */
  detail: string
  /** Registry reference the provider returned. */
  reference: string
  /** When it landed in the registry (display string, French, pre-departure). */
  at: string
  /** Present for pending/attention rows: what the operator should know. */
  note?: string
}

export type NeedCategory =
  | 'Fauteuil roulant'
  | 'Mobilité réduite'
  | 'Déficience visuelle'
  | 'Déficience auditive'
  | 'Trouble cognitif'
  | 'Condition chronique'

export interface Traveler {
  id: string
  name: string
  age: number
  category: NeedCategory
  /** One-line profile, e.g. "Fauteuil électrique · Permobil M3". */
  profile: string
  /** The accessibility needs the agent worked from. */
  needs: string[]
  confirmations: Confirmation[]
}
