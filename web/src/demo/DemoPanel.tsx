import React, { useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, PhoneOff, Mic, Maximize2, Zap } from 'lucide-react'
import { startLiveCall, supportsVapi, type LiveCall } from '../lib/vapiCall'
import LiveCallModal, { type LiveCallPhase } from './LiveCallModal'
import type { AppState, Step } from '../../../shared/types'

type PostBodyFn = (url: string, body: unknown, label: string) => Promise<void>

interface DemoPanelProps {
  state: AppState
  reload: () => Promise<AppState>
}

// Presenter's control panel. M1: Reset. Later milestones add Chaos, Start-call,
// force-step overrides (M6 "invisible insurance").
export default function DemoPanel({ state, reload }: DemoPanelProps) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState<LiveCall | null>(null)
  // Live-call modal: phase drives the staging; the modal can be minimized
  // (call keeps running) and stays up after hang-up to show the confirmation.
  const [callPhase, setCallPhase] = useState<LiveCallPhase>('connecting')
  const [callError, setCallError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [assistantSpeaking, setAssistantSpeaking] = useState(false)
  const volumeRef = useRef(0)
  const canLive = supportsVapi()

  async function post(url: string, label: string) {
    return postBody(url, undefined, label)
  }

  async function startLive() {
    setCallError('')
    setCallPhase('connecting')
    setModalOpen(true)
    setStatus('Appel IA en direct : connexion au micro…')
    const ctl = await startLiveCall({
      onStatus: (s) => {
        setStatus(`Appel IA en direct : ${s === 'in_progress' ? 'en cours' : 'terminé'}`)
        if (s === 'in_progress') setCallPhase('live')
        if (s === 'ended') {
          setCallPhase('ended')
          setLive(null)
          setAssistantSpeaking(false)
          void reload()
        }
      },
      onError: (m) => {
        setStatus(`Appel IA en direct : ${m}`)
        setCallPhase('error')
        setCallError(m)
        setLive(null)
        setAssistantSpeaking(false)
      },
      onVolume: (v) => {
        volumeRef.current = v
      },
      onAssistantSpeaking: setAssistantSpeaking,
    })
    if (ctl) setLive(ctl)
  }

  function closeModal() {
    // While the call runs this only minimizes; the Raccrocher button hangs up.
    setModalOpen(false)
  }

  const postBody: PostBodyFn = async (url, body, label) => {
    setBusy(true)
    setStatus(`${label}…`)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await reload()
      setStatus(`${label} : OK`)
    } catch (err) {
      setStatus(`${label} : échec (${(err as Error).message})`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>Panneau de démo</h1>
      <p className="muted" style={{ marginTop: '-0.4rem' }}>
        Contrôles du présentateur. Tout peut être réinitialisé en un clic.
      </p>

      <section className="panel" aria-labelledby="guided-title" style={{ marginBottom: '1rem' }}>
        <h2 id="guided-title" className="h2-icon">
          <Play size={18} aria-hidden="true" /> Démo guidée
        </h2>
        <p className="muted" style={{ marginTop: '-0.3rem' }}>
          Déroulé automatique et narré des trois flux (perturbation, appel IA, vision). Idéal pour
          la scène.
        </p>
        <button
          type="button"
          className="primary"
          onClick={() => window.dispatchEvent(new CustomEvent('guided-demo-start'))}
        >
          <Play size={16} aria-hidden="true" /> Lancer la démo guidée
        </button>
      </section>

      <section className="panel" aria-labelledby="demo-controls-title">
        <h2 id="demo-controls-title">Contrôles manuels</h2>
        <div className="demo-actions">
          <button
            type="button"
            className="danger"
            onClick={() => post('/api/demo/reset', 'Réinitialisation')}
            disabled={busy}
          >
            <RotateCcw size={16} aria-hidden="true" /> Réinitialiser la démo
          </button>

          {live ? (
            <>
              <button type="button" className="danger is-live-call" onClick={() => live.stop()}>
                <span className="call-live-dot" aria-hidden="true" />
                <PhoneOff size={16} aria-hidden="true" /> Raccrocher
              </button>
              {!modalOpen && (
                <button type="button" onClick={() => setModalOpen(true)}>
                  <Maximize2 size={16} aria-hidden="true" /> Afficher l'appel
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="primary"
              onClick={startLive}
              disabled={busy || !canLive}
              title={
                canLive
                  ? 'Le testeur joue la réception ; parlez au micro'
                  : 'Configurez VITE_VAPI_PUBLIC_KEY et VITE_VAPI_ASSISTANT_ID'
              }
            >
              <Mic size={16} aria-hidden="true" /> Appel IA en direct (micro)
            </button>
          )}
        </div>

        <p className="demo-status" role="status" aria-live="polite">
          {status}
        </p>

        {!canLive && (
          <p className="muted" style={{ marginTop: '-0.3rem' }}>
            Appel en direct désactivé : définissez VITE_VAPI_PUBLIC_KEY et VITE_VAPI_ASSISTANT_ID.
          </p>
        )}

        <p className="demo-note">
          État actuel : {state.trip.steps.length} étapes · {state.ledger.length} confirmation(s) au
          registre · {state.agentLog.length} ligne(s) de journal.
        </p>
      </section>

      <section className="panel" aria-labelledby="scenarios-title" style={{ marginTop: '1rem' }}>
        <h2 id="scenarios-title" className="h2-icon">
          <Zap size={18} aria-hidden="true" /> Perturbations
        </h2>
        <p className="muted" style={{ marginTop: '-0.3rem' }}>
          Injectez un incident - le watchdog détecte, le planificateur remédie, chaque type a sa
          cascade.
        </p>
        <div className="demo-actions">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => postBody('/api/demo/chaos', { scenarioId: sc.id }, sc.label)}
              disabled={busy}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </section>

      <ForceControls steps={state.trip.steps} postBody={postBody} busy={busy} />

      <AnimatePresence>
        {modalOpen && (
          <LiveCallModal
            phase={callPhase}
            error={callError}
            call={state.call}
            transcript={state.transcript}
            assistantSpeaking={assistantSpeaking}
            volumeRef={volumeRef}
            onHangUp={() => live?.stop()}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// mirrors server/scenarios.ts (SCENARIOS catalog)
const SCENARIOS = [
  { id: 'tgv-delay', label: 'Retard TGV (55 min)' },
  { id: 'strike', label: 'Grève SNCF (train supprimé)' },
  { id: 'elevator', label: 'Ascenseur PMR en panne' },
  { id: 'weather', label: 'Alerte météo (orage)' },
  { id: 'taxi-cancel', label: 'Taxi adapté annulé' },
]

const STATUSES = [
  'identified',
  'contacted',
  'confirmed',
  'reconfirmed',
  'in_progress',
  'done',
  'at_risk',
  'failed',
]

// M6 "invisible insurance": force any step to any status manually if a live
// event fails on stage.
function ForceControls({
  steps,
  postBody,
  busy,
}: {
  steps: Step[]
  postBody: PostBodyFn
  busy: boolean
}) {
  const [stepId, setStepId] = useState(steps[0]?.id || 's1')
  const [status, setStatus] = useState('at_risk')
  const [reason, setReason] = useState('')

  return (
    <section
      className="panel"
      aria-labelledby="force-title"
      style={{ marginTop: '1rem', borderStyle: 'dashed' }}
    >
      <h2 id="force-title">Contrôles de secours</h2>
      <p className="muted" style={{ marginTop: '-0.3rem' }}>
        Forçage manuel d'une étape - assurance invisible si un événement échoue en direct.
      </p>
      <div className="demo-actions" style={{ alignItems: 'flex-end' }}>
        <label>
          Étape
          <br />
          <select value={stepId} onChange={(e) => setStepId(e.target.value)} disabled={busy}>
            {steps.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} - {s.title.slice(0, 28)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Statut
          <br />
          <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy}>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>
        <label>
          Motif (optionnel)
          <br />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
            placeholder="ex. TGV retardé"
          />
        </label>
        <button
          type="button"
          onClick={() =>
            postBody(
              '/api/demo/force-step',
              { stepId, status, reason: reason || null },
              `Forçage ${stepId} → ${status}`,
            )
          }
          disabled={busy}
        >
          Forcer
        </button>
      </div>
    </section>
  )
}
