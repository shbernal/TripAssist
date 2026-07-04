// Data-integrity validation. Enforces the invariants that keep the dataset
// consulting-grade: valid references, unique keys, coherent statuses, and
// alignment with the reference master data. validateAppState returns a list of
// human-readable issues (empty array = the data is sound). Exercised by tests.
import type { AppState, StepStatus } from '../shared/types.js'
import { CLIENTS, CATEGORY_SSR, STATIONS } from '../shared/reference.js'

const VALID_STATUSES: ReadonlySet<StepStatus> = new Set<StepStatus>([
  'identified',
  'contacted',
  'confirmed',
  'reconfirmed',
  'in_progress',
  'done',
  'at_risk',
  'failed',
])

export function validateAppState(state: AppState): string[] {
  const issues: string[] = []
  const stepIds = new Set<string>()
  const refs = new Set<string>()

  // --- trip steps ---
  for (const st of state.trip.steps) {
    if (stepIds.has(st.id)) issues.push(`Étape en double: ${st.id}`)
    stepIds.add(st.id)
    if (!VALID_STATUSES.has(st.status)) issues.push(`Statut invalide sur ${st.id}: ${st.status}`)
    if (st.ref) {
      if (refs.has(st.ref)) issues.push(`Référence dupliquée: ${st.ref} (${st.id})`)
      refs.add(st.ref)
    }
    if (st.depends_on.includes(st.id)) issues.push(`Dépendance circulaire sur ${st.id}`)
  }
  for (const st of state.trip.steps) {
    for (const dep of st.depends_on) {
      if (!stepIds.has(dep)) issues.push(`${st.id} dépend d'une étape inconnue: ${dep}`)
    }
  }

  // --- ledger references an existing step ---
  for (const entry of state.ledger) {
    if (!stepIds.has(entry.step)) {
      issues.push(`Écriture registre liée à une étape inconnue: ${entry.step}`)
    }
  }

  // --- fleet integrity + alignment with the reference master data ---
  const fleetIds = new Set<string>()
  for (const f of state.fleet) {
    if (fleetIds.has(f.id)) issues.push(`Voyageur flotte en double: ${f.id}`)
    fleetIds.add(f.id)
    if (f.steps.length === 0) issues.push(`Voyageur ${f.id} sans étape`)
    if (f.confirmations < 0 || f.confirmations > f.steps.length) {
      issues.push(`Confirmations incohérentes pour ${f.id}: ${f.confirmations}/${f.steps.length}`)
    }
    for (const s of f.steps) {
      if (!VALID_STATUSES.has(s)) issues.push(`Statut flotte invalide (${f.id}): ${s}`)
    }
    if (!CLIENTS[f.client]) issues.push(`Client hors référentiel pour ${f.id}: ${f.client}`)
    if (!(f.category in CATEGORY_SSR)) {
      issues.push(`Catégorie de handicap hors référentiel (${f.id}): ${f.category}`)
    }
  }

  // --- reference master data itself ---
  for (const [key, station] of Object.entries(STATIONS)) {
    if (!/^\d{8}$/.test(station.uic)) issues.push(`Code UIC invalide pour ${key}: ${station.uic}`)
  }

  return issues
}
