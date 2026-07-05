import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PhoneCall, PhoneOff, Minimize2, X, AlertTriangle } from 'lucide-react'
import Waveform from '../ops/Waveform'
import { Avatar, ConfirmationStamp } from '../ops/CallPanel'
import type { CallState, TranscriptChunk } from '../../../shared/types'

export type LiveCallPhase = 'connecting' | 'live' | 'ended' | 'error'

interface LiveCallModalProps {
  phase: LiveCallPhase
  /** Error message when phase === 'error'. */
  error?: string
  call: Partial<CallState>
  transcript: TranscriptChunk[]
  /** Real-time floor holder from the Vapi speech-start/end events. */
  assistantSpeaking: boolean
  /** Assistant audio level (0..1), mutated ~10×/s - read via rAF, never state. */
  volumeRef: React.MutableRefObject<number>
  onHangUp: () => void
  /** Minimize while live (call keeps running) or dismiss once ended. */
  onClose: () => void
}

const PHASE_LABEL: Record<LiveCallPhase, string> = {
  connecting: 'Connexion au micro…',
  live: 'En ligne',
  ended: 'Terminé',
  error: "Échec de l'appel",
}

// How long the receptionist's orb keeps glowing after their transcript line
// lands (we have no mic-level event for the human side, only finals).
const HUMAN_GLOW_MS = 2800

/**
 * The live Vapi call, staged as a modal: speaking orbs, a voice-reactive
 * waveform (driven by the assistant's real audio level), the streaming
 * transcript, and the confirmation stamp once the extractor resolves the call.
 * Escape or the backdrop minimizes without hanging up; only the explicit
 * "Raccrocher" button ends the call.
 */
export default function LiveCallModal({
  phase,
  error,
  call,
  transcript,
  assistantSpeaking,
  volumeRef,
  onHangUp,
  onClose,
}: LiveCallModalProps) {
  const reduced = useReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)
  const waveRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const [humanGlow, setHumanGlow] = useState(false)

  const live = phase === 'live'
  const onCall = phase === 'connecting' || live

  // Focus management: remember the opener, focus the dialog's primary action,
  // keep Tab cycling inside, hand focus back on unmount.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLElement>('button')?.focus()
    return () => opener?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>('button, [href], input, select, [tabindex="0"]'),
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  // Voice-reactive waveform: a rAF loop reads the assistant's audio level and
  // swells the whole wave through a CSS variable - no React re-renders.
  useEffect(() => {
    const node = waveRef.current
    if (!live || reduced || !node) return
    let raf = 0
    const tick = () => {
      node.style.setProperty('--amp', volumeRef.current.toFixed(3))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      node.style.setProperty('--amp', '0')
    }
  }, [live, reduced, volumeRef])

  // The human side has no live audio event, only finalized transcript lines:
  // glow the reception orb briefly whenever one of theirs lands.
  const lastHuman = transcript.filter((c) => c.speaker === 'human').length
  useEffect(() => {
    if (!live || lastHuman === 0) return
    setHumanGlow(true)
    const t = setTimeout(() => setHumanGlow(false), HUMAN_GLOW_MS)
    return () => clearTimeout(t)
  }, [live, lastHuman])

  // Keep the newest bubble in view.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [transcript.length, phase])

  const activeSpeaker = live ? (assistantSpeaking ? 'assistant' : humanGlow ? 'human' : null) : null
  const extracting = phase === 'ended' && call.status !== 'extracted'
  const stamp = phase === 'ended' && call.status === 'extracted' ? call.extracted : undefined

  return (
    <motion.div
      className="call-modal-backdrop"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        className="call-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-call-title"
        data-phase={phase}
        onClick={(e) => e.stopPropagation()}
        initial={reduced ? false : { opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        <header className="call-modal-head">
          <span className={`call-modal-icon ${onCall ? 'is-on-call' : ''}`} aria-hidden="true">
            <PhoneCall size={18} />
          </span>
          <div className="call-modal-titles">
            <h2 id="live-call-title">Appel IA en direct</h2>
            <p className="muted">Hôtel Beau Rivage · chambre accessible, douche à l'italienne</p>
          </div>
          <span className="call-stage-badge" data-status={phase} role="status" aria-live="polite">
            {live ? <span className="call-live-dot" aria-hidden="true" /> : null}
            {PHASE_LABEL[phase]}
          </span>
        </header>

        <div className="call-stage call-modal-stage" data-live={live ? 'true' : 'false'}>
          <Avatar who="assistant" speaking={activeSpeaker === 'assistant'} reduced={reduced} />
          <div className="call-stage-mid">
            <div className="call-modal-wave" ref={waveRef}>
              <Waveform playing={onCall} speaker={activeSpeaker} bars={34} />
            </div>
            {phase === 'connecting' && (
              <span className="call-modal-hint" aria-hidden="true">
                Autorisez le micro : vous jouez la réception
                <span className="call-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            )}
          </div>
          <Avatar who="human" speaking={activeSpeaker === 'human'} reduced={reduced} />
        </div>

        <div
          className="transcript call-modal-transcript"
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Transcription de l'appel en direct"
        >
          {/* While connecting, server state may still hold the previous call's
              transcript (it resets on call-start) - show the placeholder instead. */}
          {phase === 'connecting' || transcript.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              {onCall
                ? 'La transcription apparaît dès les premiers mots…'
                : 'Aucune transcription.'}
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {transcript.map((c, i) => (
                <motion.div
                  key={i}
                  layout={!reduced}
                  initial={
                    reduced
                      ? false
                      : { opacity: 0, y: 10, scale: 0.96, x: c.speaker === 'assistant' ? -12 : 12 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                  className={`bubble ${c.speaker === 'assistant' ? 'bubble-ia' : 'bubble-human'}`}
                >
                  <span className="bubble-who">
                    {c.speaker === 'assistant' ? 'Assistante IA' : 'Réception'}
                  </span>
                  <span className="bubble-text">{c.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {phase === 'error' && (
          <p className="call-modal-error" role="alert">
            <AlertTriangle size={15} aria-hidden="true" /> {error || 'Erreur Vapi'}
          </p>
        )}

        {extracting && (
          <p className="call-modal-extracting" role="status" aria-live="polite">
            Analyse de la confirmation
            <span className="call-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
        )}

        <AnimatePresence>
          {stamp ? <ConfirmationStamp extracted={stamp} reduced={reduced} /> : null}
        </AnimatePresence>

        <footer className="call-modal-actions">
          {onCall ? (
            <>
              <button type="button" className="danger is-live-call" onClick={onHangUp}>
                <PhoneOff size={16} aria-hidden="true" /> Raccrocher
              </button>
              <button type="button" onClick={onClose}>
                <Minimize2 size={16} aria-hidden="true" /> Réduire
              </button>
            </>
          ) : (
            <button type="button" onClick={onClose}>
              <X size={16} aria-hidden="true" /> Fermer
            </button>
          )}
        </footer>
      </motion.div>
    </motion.div>
  )
}
