import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Volume2,
  VolumeX,
  Bot,
  ConciergeBell,
  PhoneCall,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react'
import { speak, cancelSpeech, supportsSpeech } from '../lib/speech'
import Waveform from './Waveform'
import type { CallState, Extracted, TranscriptChunk } from '../../../shared/types'

const STATUS_LABEL: Record<string, string> = {
  idle: 'Aucun appel',
  dialing: 'Numérotation…',
  ringing: 'Sonnerie…',
  in_progress: 'En cours',
  ended: 'Terminé',
  extracted: 'Analysé',
}

interface CallPanelProps {
  call?: Partial<CallState>
  transcript?: TranscriptChunk[]
}

// The AI agent and the person on the other end of the line, drawn as speaking
// orbs. Icon-only avatars keep the panel asset-free (no face images) while the
// pulsing ring shows who currently holds the floor. Shared with the live-call
// modal (demo panel) so both call surfaces look like one product.
export function Avatar({
  who,
  speaking,
  reduced,
}: {
  who: 'assistant' | 'human'
  speaking: boolean
  reduced: boolean | null
}) {
  const isIa = who === 'assistant'
  const Icon = isIa ? Bot : ConciergeBell
  const label = isIa ? 'Assistante IA' : 'Réception'
  return (
    <div className={`call-avatar ${isIa ? 'is-ia' : 'is-human'}`}>
      <motion.div
        className={`call-orb ${speaking ? 'is-speaking' : ''}`}
        animate={reduced ? undefined : { scale: speaking ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {speaking && !reduced ? <span className="call-orb-ping" aria-hidden="true" /> : null}
        <Icon size={22} aria-hidden="true" />
      </motion.div>
      <span className="call-avatar-label">{label}</span>
    </div>
  )
}

// The facts the call secured, distilled into chips. Booleans only render the
// affirmative side; nulls (never mentioned) are skipped so the stamp stays a
// list of wins.
function securedFacts(x: Extracted): string[] {
  const facts: string[] = []
  if (x.reference) facts.push(`Réf. ${x.reference}`)
  if (x.room_number) facts.push(`Chambre ${x.room_number}`)
  if (x.room_available) facts.push('Chambre disponible')
  if (x.roll_in_shower) facts.push("Douche à l'italienne")
  if (x.bed_height_ok) facts.push('Hauteur de lit OK')
  for (const c of x.commitments) facts.push(c)
  return facts
}

// The call's outcome, stamped in with a spring once the extractor resolves it.
// Mirrors the milestone stamps of the Camille story on the concept branch.
export function ConfirmationStamp({
  extracted,
  reduced,
}: {
  extracted: Extracted
  reduced: boolean | null
}) {
  const facts = securedFacts(extracted)
  const flags = extracted.red_flags ?? []
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.06, delayChildren: 0.1 } },
  }
  const chip = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, scale: 0.6, y: 8 },
        show: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { type: 'spring', stiffness: 320, damping: 18 },
        },
      }
  return (
    <motion.div
      className="call-stamp"
      role="status"
      initial={reduced ? false : { opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="call-stamp-head">
        <motion.span
          className="call-stamp-check"
          aria-hidden="true"
          initial={reduced ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.05 }}
        >
          <BadgeCheck size={20} />
        </motion.span>
        <div>
          <p className="call-stamp-title">Accessibilité confirmée</p>
          <p className="call-stamp-by">
            {extracted.confirmed_by}
            {extracted.role ? ` · ${extracted.role}` : ''}
          </p>
        </div>
      </div>
      {facts.length > 0 && (
        <motion.ul
          className="call-stamp-chips"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {facts.map((f, i) => (
            <motion.li key={i} className="call-chip" variants={chip}>
              <BadgeCheck size={13} aria-hidden="true" /> {f}
            </motion.li>
          ))}
        </motion.ul>
      )}
      {flags.length > 0 && (
        <ul className="call-stamp-chips">
          {flags.map((f, i) => (
            <li key={i} className="call-chip is-flag">
              <AlertTriangle size={13} aria-hidden="true" /> {f}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

// Live call panel: an animated stage (speaking orbs + waveform) over the
// transcript bubbles, spoken aloud in a French voice as they stream.
// aria-live=polite so VoiceOver also announces each new line.
export default function CallPanel({ call = {}, transcript = [] }: CallPanelProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const spokenRef = useRef(0) // how many bubbles we've already voiced
  const [voiceOn, setVoiceOn] = useState(true)
  const reduced = useReducedMotion()
  // During a live Vapi web call the audio already plays through the browser, so
  // local speech synthesis would double every line - suppress it.
  const vapiWeb = call.mode === 'vapi-web'
  const canSpeak = supportsSpeech() && !vapiWeb

  // On mount / after a reset, don't replay bubbles already present (e.g. on reload).
  useEffect(() => {
    if (transcript.length === 0) spokenRef.current = 0
  }, [transcript.length])

  // Speak newly-arrived bubbles.
  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight

    if (!voiceOn || !canSpeak) {
      spokenRef.current = transcript.length
      return
    }
    if (transcript.length > spokenRef.current) {
      for (let i = spokenRef.current; i < transcript.length; i++) {
        const c = transcript[i]
        speak(c.text, { who: c.speaker === 'assistant' ? 'assistant' : 'human' })
      }
      spokenRef.current = transcript.length
    }
  }, [transcript, voiceOn, canSpeak])

  useEffect(() => () => cancelSpeech(), []) // stop speech when unmounting

  const status = call.status || 'idle'
  const active = status !== 'idle'
  const live = status === 'dialing' || status === 'ringing' || status === 'in_progress'

  // Whoever spoke last holds the floor while the call is live; nobody once it
  // ends. Drives the speaking orb ring and the waveform tint.
  const lastSpeaker = transcript.length ? transcript[transcript.length - 1].speaker : null
  const activeSpeaker = live ? lastSpeaker : null

  function toggleVoice() {
    setVoiceOn((v) => {
      if (v) cancelSpeech()
      return !v
    })
  }

  return (
    <section className="panel" aria-labelledby="call-title">
      <div className="panel-head">
        <h2 id="call-title" style={{ margin: 0 }}>
          Appel de re-confirmation
          <span className="call-status" data-status={status}>
            {' '}
            · {STATUS_LABEL[status] || status}
            {call.mode === 'simulation' && active && <span className="muted"> (simulation)</span>}
          </span>
        </h2>
        {canSpeak && (
          <button
            type="button"
            className="voice-toggle"
            onClick={toggleVoice}
            aria-pressed={voiceOn}
            title={voiceOn ? 'Couper la voix' : 'Activer la voix'}
          >
            {voiceOn ? (
              <>
                <Volume2 size={16} aria-hidden="true" /> Voix
              </>
            ) : (
              <>
                <VolumeX size={16} aria-hidden="true" /> Muet
              </>
            )}
          </button>
        )}
      </div>

      {/* Animated call stage: only mounts once a call is under way. */}
      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            key="stage"
            className="call-stage"
            data-live={live ? 'true' : 'false'}
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduced ? undefined : { opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <Avatar who="assistant" speaking={activeSpeaker === 'assistant'} reduced={reduced} />
            <div className="call-stage-mid">
              <Waveform playing={live} speaker={activeSpeaker} />
              <span className="call-stage-badge" data-status={status}>
                {live ? (
                  <>
                    <span className="call-live-dot" aria-hidden="true" /> En ligne
                  </>
                ) : (
                  <>
                    <PhoneCall size={12} aria-hidden="true" /> {STATUS_LABEL[status] || status}
                  </>
                )}
              </span>
            </div>
            <Avatar who="human" speaking={activeSpeaker === 'human'} reduced={reduced} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        className="transcript"
        ref={boxRef}
        role="log"
        aria-live="polite"
        aria-label="Transcription de l'appel en direct"
      >
        {transcript.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            {active ? 'Connexion…' : "Aucune transcription. Lancez l'appel depuis le panneau démo."}
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

      <AnimatePresence>
        {call.extracted ? <ConfirmationStamp extracted={call.extracted} reduced={reduced} /> : null}
      </AnimatePresence>
    </section>
  )
}
