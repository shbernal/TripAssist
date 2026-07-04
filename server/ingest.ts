// Booking ingestion (§5.3): turn a pasted itinerary / booking confirmation into a
// structured trip - the MVP entry point. Mirrors the extractor agent's shape: a JSON
// schema + French system prompt driven through the shared Claude bridge (HTTP token or
// local CLI), with a deterministic fallback so it never hard-fails offline / in CI.
import { claudeJSON, claudeEnabled } from './agents/claude.js'
import type { AppState, Step, StepStatus, Traveler } from '../shared/types.js'

// The slice of the trip we ask the model to extract. A subset of shared/types.ts -
// enough to seed a Trip + the traveler's accessibility needs.
export interface ParsedItinerary {
  traveler: {
    name: string
    lang: string
    profile_functional_needs: string[]
  }
  trip: {
    label: string
    steps: Array<{
      title: string
      provider: string
      when: string
      ref: string
    }>
  }
}

const INGEST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    traveler: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        lang: { type: 'string' },
        profile_functional_needs: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'lang', 'profile_functional_needs'],
    },
    trip: {
      type: 'object',
      additionalProperties: false,
      properties: {
        label: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              provider: { type: 'string' },
              when: { type: 'string' },
              ref: { type: 'string' },
            },
            required: ['title', 'provider', 'when', 'ref'],
          },
        },
      },
      required: ['label', 'steps'],
    },
  },
  required: ['traveler', 'trip'],
}

const SYSTEM = `Tu analyses une réservation / un itinéraire de voyage pour une personne à mobilité réduite. Extrais un voyage structuré en JSON strict: {traveler:{name, lang, profile_functional_needs:[string]}, trip:{label, steps:[{title, provider, when, ref}]}}. Chaque étape (train, assistance gare, taxi adapté, hôtel, restaurant…) devient un step. profile_functional_needs liste les besoins d'accessibilité repérés (fauteuil roulant, douche à l'italienne, assistance embarquement, itinéraire sans marche…). lang = code langue ('fr' par défaut). Si une information manque, mets une valeur vide plausible plutôt que d'inventer des références.`

// Defaults for the parts of a full Traveler an itinerary rarely spells out. Ingestion
// captures identity + needs; equipment/caregiver/contact are filled in later by the
// operator, so we seed neutral placeholders rather than fabricate details.
function fullTraveler(parsed: ParsedItinerary['traveler']): Traveler {
  return {
    name: parsed.name || 'Voyageur',
    age: 0,
    lang: parsed.lang || 'fr',
    profile_functional_needs: parsed.profile_functional_needs || [],
    equipment: {
      type: '',
      model: '',
      weight_kg: 0,
      battery: '',
      dimensions_cm: { l: 0, w: 0, h: 0 },
    },
    caregiver: { name: '', relation: '', access: 'read-only' },
    emergency_contact: '',
  }
}

// Wrap parsed steps into full Step objects (ids, linear dependency chain, initial
// status). Newly ingested steps start `identified` - nothing has been contacted yet.
function buildSteps(parsed: ParsedItinerary['trip']['steps']): Step[] {
  return parsed.map((s, i) => {
    const id = `s${i + 1}`
    const status: StepStatus = 'identified'
    return {
      id,
      title: s.title || `Étape ${i + 1}`,
      provider: s.provider || '',
      when: s.when || '',
      depends_on: i === 0 ? [] : [`s${i}`],
      status,
      ref: s.ref || '',
    }
  })
}

// Assemble a valid AppState from a parsed itinerary - same shape seed() produces, but
// empty ledger/logs and zeroed metrics: a fresh trip nothing has acted on yet.
function toAppState(parsed: ParsedItinerary): AppState {
  return {
    traveler: fullTraveler(parsed.traveler),
    trip: { label: parsed.trip.label || 'Voyage', steps: buildSteps(parsed.trip.steps) },
    ledger: [],
    agentLog: [
      { agent: 'system', level: 'info', message: 'Itinéraire importé - étapes identifiées.' },
    ],
    transcript: [],
    disruptions: [],
    replan: null,
    visionVerdict: null,
    call: { status: 'idle', id: null },
    metrics: { minutesRecovered: 0, interventions: 0, callsMade: 0 },
    fleet: [],
  }
}

// --- deterministic fallback (offline / CI) ----------------------------------
// No model: pull a few obvious signals out of the raw text so the endpoint always
// yields a usable, well-formed trip.

const NEED_HINTS: Array<[RegExp, string]> = [
  [/fauteuil|wheelchair|pmr|roulant/i, 'fauteuil roulant - assistance mobilité'],
  [/douche|shower|italienne|roll-?in/i, "douche à l'italienne (roll-in)"],
  [/embarqu|débarqu|boarding|assistance gare/i, 'assistance embarquement/débarquement'],
  [/sans marche|plain-?pied|step-?free|escalier/i, 'itinéraire sans marche'],
  [/aveugle|malvoyant|guide|braille/i, 'accompagnement déficience visuelle'],
]

function fallbackParse(raw: string): ParsedItinerary {
  const text = raw.trim()

  // Route label: first "A → B" / "A - B" / "A vers B" pair of place-like tokens.
  const route = text.match(/([A-ZÀ-Ÿ][\wÀ-ÿ'-]+)\s*(?:→|->|-|–|vers|to)\s*([A-ZÀ-Ÿ][\wÀ-ÿ'-]+)/)
  const label = route ? `${route[1]} → ${route[2]}` : 'Voyage importé'

  const needs = NEED_HINTS.filter(([re]) => re.test(text)).map(([, need]) => need)

  // Steps: one per line that looks itinerary-ish (train/hotel/taxi/assistance/resto).
  const stepLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) =>
      /tgv|train|sncf|hôtel|hotel|taxi|assistance|gare|restaurant|vol|avion|chambre/i.test(l),
    )
    .slice(0, 8)

  const steps = (stepLines.length ? stepLines : [text.split('\n')[0] || 'Étape à préciser']).map(
    (line) => {
      const when = line.match(/\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?(?:\s+\d{1,2}[:h]\d{2})?/)
      const provider = /sncf|tgv/i.test(line)
        ? 'SNCF'
        : /hôtel|hotel|chambre/i.test(line)
          ? 'Hôtel'
          : /taxi/i.test(line)
            ? 'Taxi adapté'
            : /assistance|gare/i.test(line)
              ? "Assist'enGare"
              : ''
      return {
        title: line.slice(0, 120),
        provider,
        when: when ? when[0] : '',
        ref: '',
      }
    },
  )

  return {
    traveler: { name: 'Voyageur', lang: 'fr', profile_functional_needs: needs },
    trip: { label, steps },
  }
}

export interface IngestResult {
  state: AppState
  source: 'claude' | 'fallback'
  error?: string
}

// Parse a raw itinerary into a full AppState. Uses Claude when available, else the
// deterministic fallback; on a Claude error it also falls back (and reports why).
export async function ingestItinerary(raw: string): Promise<IngestResult> {
  const text = String(raw || '').trim()
  if (!text) throw new Error('itinéraire vide')

  if (!claudeEnabled()) {
    return { state: toAppState(fallbackParse(text)), source: 'fallback' }
  }
  try {
    const parsed = (await claudeJSON({
      system: SYSTEM,
      user: text,
      schema: INGEST_SCHEMA,
      maxTokens: 2000,
    })) as ParsedItinerary
    return { state: toAppState(parsed), source: 'claude' }
  } catch (err) {
    return {
      state: toAppState(fallbackParse(text)),
      source: 'fallback',
      error: (err as Error).message,
    }
  }
}

export default { ingestItinerary }
