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
// roll-in-shower scenario as server/agents/caller.ts so the web call is on topic.
const CALL_CONTEXT = [
  'Prestataire appelé : Hôtel Beau Rivage.',
  "Objectif : confirmer une chambre accessible avec douche à l'italienne (roll-in shower).",
  'Détails : Chambre 104, référence BR-104-ACC, séjour du 12 septembre.',
  'Voyageuse : Camille Moreau. Obtiens une confirmation claire et, si possible,' +
    " le nom de l'interlocuteur et une référence.",
].join(' ')

export interface LiveCallHandlers {
  onStatus?: (status: 'in_progress' | 'ended') => void
  onError?: (message: string) => void
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
    handlers.onStatus?.('ended')
  }

  vapi.on('call-start', () => {
    void relay('start')
    handlers.onStatus?.('in_progress')
  })

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
