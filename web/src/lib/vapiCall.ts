// Live Vapi web call: the tester's browser is the hotel receptionist, the Vapi
// assistant is TripAssist's AI caller. The whole voice loop (transcription,
// model, voice) runs client-side on Vapi's defaults - no Anthropic/ElevenLabs
// key in this app, only a Vapi public key + a dashboard assistant id.
//
// We relay the call lifecycle to the server (/api/call/web/*) so the transcript
// lands in server state and every view + aria-live region updates over the same
// SSE pipeline the scripted simulation uses. At call end the existing extractor
// turns the conversation into a registry confirmation.
//
// The @vapi-ai/web SDK (bundled with Daily) is heavy and only needed once the
// presenter starts a call, so it is loaded via dynamic import() to keep it out
// of the initial bundle.
const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID

export function supportsVapi(): boolean {
  return Boolean(PUBLIC_KEY && ASSISTANT_ID)
}

// The dashboard assistant's system prompt ends with a {{callContext}} variable
// (the phone path fills it via assistantOverrides). We brief the same hotel /
// roll-in-shower scenario as server/agents/caller.ts so the web call is on topic,
// with the same strict brevity rules: one goal, no name-collecting, no small talk,
// hang up as soon as the answer is clear. FIRST_MESSAGE skips any generic greeting
// so the call opens directly on the confirmation question.
const CALL_CONTEXT = [
  'Prestataire appelé : Hôtel Beau Rivage.',
  "Objectif : confirmer une chambre accessible avec douche à l'italienne (roll-in shower).",
  "Détails : Chambre 104, référence BR-104-ACC (à l'oral, épelle-la : « B R, 1 0 4, A C C »).",
  'Séjour du 12 septembre.',
  'Voyageuse : Camille Moreau.',
  'Consignes strictes : va droit au but, une seule question à la fois, uniquement sur' +
    ' cet objectif. Ne demande jamais le nom de ton interlocuteur ni aucune information' +
    ' hors sujet, ne fais pas de conversation. Dès que la réponse (confirmation ou refus)' +
    ' est claire, reformule-la en une phrase puis termine immédiatement par la phrase' +
    ' exacte : « Merci, bonne journée. »',
].join(' ')

// Vapi hangs up when the assistant speaks one of these, even if the dashboard
// assistant lacks the End Call tool - without it the AI has no way to actually
// end the call it announces. Keep in sync with server/agents/caller.ts.
const END_CALL_PHRASES = ['bonne journée', 'au revoir']

// The reference is spelled out ("B R, 1 0 4, A C C") because this string goes
// straight to TTS: written as "BR-104-ACC" the voice invents pronunciations
// ("104" read in English, "BR"/"ACC" as pseudo-words). Keep in sync with
// server/agents/caller.ts.
const FIRST_MESSAGE =
  "Bonjour, ici l'assistante de TripAssist. " +
  "Pouvez-vous confirmer la chambre 104 accessible avec douche à l'italienne " +
  'pour le 12 septembre, référence B R, 1 0 4, A C C ?'

export interface LiveCallHandlers {
  onStatus?: (status: 'in_progress' | 'ended') => void
  onError?: (message: string) => void
  /** Assistant output level (0..1), fires ~10×/s. Drive visuals via refs, not state. */
  onVolume?: (level: number) => void
  /** Real-time floor holder: fires ahead of transcript finals. */
  onAssistantSpeaking?: (speaking: boolean) => void
}

export interface LiveCall {
  stop: () => void
}

// Best-effort relay: if it fails the live audio still plays, we just miss a
// transcript line in the UI.
async function relay(path: string, body?: unknown): Promise<void> {
  try {
    await fetch(`/api/call/web/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    /* ignore */
  }
}

export async function startLiveCall(handlers: LiveCallHandlers = {}): Promise<LiveCall | null> {
  if (!supportsVapi()) {
    handlers.onError?.('Clé Vapi absente (VITE_VAPI_PUBLIC_KEY / VITE_VAPI_ASSISTANT_ID).')
    return null
  }

  const { default: Vapi } = await import('@vapi-ai/web')
  const vapi = new Vapi(PUBLIC_KEY as string)
  let ended = false

  const finish = () => {
    if (ended) return
    ended = true
    void relay('end')
    handlers.onAssistantSpeaking?.(false)
    handlers.onStatus?.('ended')
  }

  vapi.on('call-start', () => {
    // Await the relay: /call/web/start resets the server transcript and broadcasts
    // transcript_reset, so by the time the UI flips to 'live' the previous call's
    // lines are gone instead of flashing under the new ones.
    void relay('start').then(() => handlers.onStatus?.('in_progress'))
  })

  // Voice-reactive visuals: the waveform swells with the assistant's actual
  // audio level, and speech-start/end flips the speaking orb in real time.
  vapi.on('volume-level', (level: number) => handlers.onVolume?.(level))
  vapi.on('speech-start', () => handlers.onAssistantSpeaking?.(true))
  vapi.on('speech-end', () => handlers.onAssistantSpeaking?.(false))

  vapi.on('message', (msg: unknown) => {
    const m = msg as {
      type?: string
      role?: string
      transcriptType?: string
      transcript?: string
    }
    // Only finalized lines - partials would flood the transcript.
    if (m.type !== 'transcript' || m.transcriptType !== 'final') return
    const text = (m.transcript || '').trim()
    if (!text) return
    // Vapi role: 'assistant' = our AI caller, everything else = the receptionist.
    const speaker = m.role === 'assistant' ? 'assistant' : 'human'
    void relay('chunk', { speaker, text })
  })

  vapi.on('call-end', finish)
  vapi.on('error', (err: unknown) => {
    handlers.onError?.(err instanceof Error ? err.message : 'Erreur Vapi')
    finish()
  })

  try {
    await vapi.start(ASSISTANT_ID as string, {
      variableValues: { callContext: CALL_CONTEXT },
      firstMessage: FIRST_MESSAGE,
      endCallPhrases: END_CALL_PHRASES,
    })
  } catch (err) {
    handlers.onError?.(err instanceof Error ? err.message : "Impossible de démarrer l'appel")
    return null
  }

  return {
    stop: () => {
      void vapi.stop()
      finish()
    },
  }
}
