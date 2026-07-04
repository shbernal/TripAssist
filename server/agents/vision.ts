// Vision agent (M5): compares an uploaded photo against Camille's functional needs
// and returns an accessibility verdict with confidence + an evidence quote.
// Uses Claude vision when available; deterministic fallback keeps the demo alive.
import { getState, updateState } from '../state.js'
import { pushEvent } from '../events.js'
import { claudeJSON, claudeEnabled } from './claude.js'
import { reason, agentActive, think } from './trace.js'
import type { VisionVerdict } from '../../shared/types.js'

export interface ImageInput {
  base64?: string
  mediaType?: string
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    conforme: { type: 'boolean' },
    confiance: { type: 'number' },
    critere: { type: 'string' },
    preuve: { type: 'string' },
    recommandation: { type: 'string' },
  },
  required: ['conforme', 'confiance', 'critere', 'preuve', 'recommandation'],
}

const SYSTEM = `Tu es l'agent de vérification visuelle de TripAssist. Compare la photo au besoin d'accessibilité du voyageur (notamment: douche à l'italienne / roll-in, sans ressaut, accès de plain-pied). Réponds en JSON strict: {conforme: bool, confiance: number (0-1), critere: string, preuve: string (citation de ce que tu observes), recommandation: string}. Sois factuel et prudent.`

// Pre-seeded fallback verdict - the spec's shower-lip example.
function fallbackVerdict(): VisionVerdict {
  return {
    conforme: false,
    confiance: 0.82,
    critere: "Douche à l'italienne (roll-in)",
    preuve: 'Ressaut de douche estimé à ~15 cm - un rebord est visible au seuil du bac.',
    recommandation:
      "Non conforme à une douche à l'italienne. Signalé à l'hôtel : exiger un accès de plain-pied ou une rampe amovible validée.",
  }
}

// image: { base64, mediaType }. Returns and broadcasts the verdict.
export async function checkPhoto(image: ImageInput | null): Promise<VisionVerdict> {
  let verdict: VisionVerdict
  let source = 'fallback'
  let error: string | undefined

  await reason(
    'vision',
    [
      'Analyse de la photo fournie.',
      "Comparaison au besoin : douche à l'italienne, accès de plain-pied.",
    ],
    { keepActive: true },
  )

  if (claudeEnabled() && image?.base64) {
    try {
      verdict = await claudeVision(image)
      source = 'claude'
    } catch (err) {
      error = (err as Error).message
      verdict = fallbackVerdict()
    }
  } else {
    verdict = fallbackVerdict()
  }
  if (error) {
    pushEvent('agent_log', {
      agent: 'vision',
      level: 'warn',
      message: `Claude vision indisponible (${error}) - verdict hors ligne utilisé.`,
    })
  }

  think(
    'vision',
    verdict.conforme ? "Conforme au besoin d'accessibilité." : `Non conforme : ${verdict.preuve}`,
  )
  agentActive('vision', false)
  updateState((s) => {
    s.visionVerdict = { ...verdict, source }
  })
  pushEvent('vision_verdict', { verdict: { ...verdict, source } })
  pushEvent('agent_log', {
    agent: 'vision',
    level: verdict.conforme ? 'info' : 'warn',
    message: `Vérification visuelle : ${verdict.conforme ? 'conforme' : 'NON conforme'} - ${verdict.critere}.`,
  })
  return { ...verdict, source }
}

// Claude vision via the shared client - works over HTTP and the CLI bridge.
async function claudeVision(image: ImageInput): Promise<VisionVerdict> {
  const needs = getState().traveler.profile_functional_needs
  return (await claudeJSON({
    system: SYSTEM,
    user: `Besoins fonctionnels du voyageur : ${needs.join(' ; ')}. Cette photo est-elle conforme ?`,
    schema: VERDICT_SCHEMA,
    image: { base64: image.base64!, mediaType: image.mediaType },
    maxTokens: 1000,
  })) as VisionVerdict
}

export default { checkPhoto }
