import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { PhoneCall } from 'lucide-react'
import { asset } from '../lib/asset'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useCallPlayer } from '../lib/useCallPlayer'
import { CALLS, type CallId } from '../story/calls'
import { AudioControls } from './AudioControls'
import { Caption } from './Caption'
import { Chip } from './Chip'
import { Waveform } from './Waveform'

interface AvatarProps {
  src: string
  name: string
  role: string
  speaking: boolean
  reduced: boolean
}

function Avatar({ src, name, role, speaking, reduced }: AvatarProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={reduced ? undefined : { scale: speaking ? 1.06 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative rounded-full ${speaking ? 'ring-4 ring-brand-teal/70' : 'ring-2 ring-slate-700'}`}
      >
        {speaking && !reduced ? (
          <span className="absolute -inset-1 animate-ping rounded-full bg-brand-teal/30" />
        ) : null}
        <img
          src={asset(src)}
          alt={name}
          className="relative h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28"
        />
      </motion.div>
      <p className="text-sm font-semibold text-slate-100">{name}</p>
      <p className="text-xs uppercase tracking-wider text-slate-500">{role}</p>
    </div>
  )
}

/**
 * The animated phone-call stage for scenes 3 & 4: agent avatar ↔ callee, a live
 * waveform, the synced caption, transport controls, a full text transcript, and
 * the outcome chip that stamps in when the call resolves.
 */
export function CallStage({ callId }: { callId: CallId }) {
  const meta = CALLS[callId]
  const player = useCallPlayer(callId)
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const autoplayedRef = useRef(false)

  // Autoplay once when the stage scrolls into view. Not under reduced motion, and
  // if the browser blocks it (no gesture yet) the visible controls take over.
  useEffect(() => {
    const el = rootRef.current
    if (!el || reduced) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !autoplayedRef.current && player.status === 'ready') {
            autoplayedRef.current = true
            player.play()
          }
        }
      },
      { threshold: 0.6 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [player, reduced])

  const activeText = player.activeLineId ? meta.transcript[player.activeLineId] : null
  const speakerLabel = player.activeSpeaker === 'agent' ? meta.agent.name : meta.callee.name
  const outcome = player.manifest?.outcome
  const ended = player.status === 'ended'

  return (
    <div
      ref={rootRef}
      className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur sm:p-8"
    >
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <PhoneCall aria-hidden="true" className="h-4 w-4 text-brand-teal" />
        <span>{meta.title}</span>
      </div>

      <div className="grid grid-cols-2 items-start gap-6">
        <Avatar
          src={meta.agent.face}
          name={meta.agent.name}
          role="Agent IA"
          speaking={player.activeSpeaker === 'agent'}
          reduced={reduced}
        />
        <Avatar
          src={meta.callee.face}
          name={meta.callee.name}
          role={callId === 'airport-call' ? 'Aéroport' : 'Hôtel'}
          speaking={player.activeSpeaker === 'callee'}
          reduced={reduced}
        />
      </div>

      <div className="my-6">
        <Waveform playing={player.status === 'playing'} speaker={player.activeSpeaker} />
        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-label="Progression de l’appel"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(player.progress * 100)}
        >
          <div
            className="h-full bg-gradient-to-r from-brand-teal to-brand-violet transition-[width] duration-150"
            style={{ width: `${player.progress * 100}%` }}
          />
        </div>
      </div>

      <Caption speakerLabel={speakerLabel} speaker={player.activeSpeaker} text={activeText} />

      <div className="mt-6">
        <AudioControls player={player} />
      </div>

      {outcome ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Chip tone={ended ? 'confirmed' : 'pending'}>
            {ended ? `Confirmé · réf. ${outcome.reference}` : 'Appel en cours…'}
          </Chip>
          {ended ? <p className="text-sm text-slate-400">{outcome.summary}</p> : null}
        </div>
      ) : null}

      <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-300">
          Transcription complète de l’appel
        </summary>
        <ol className="mt-4 space-y-3">
          {player.manifest?.lines.map((line) => {
            const isAgent = line.speaker === 'agent'
            const active = line.id === player.activeLineId
            return (
              <li
                key={line.id}
                aria-current={active ? 'true' : undefined}
                className={`rounded-xl border p-3 text-sm ${
                  active
                    ? 'border-brand-teal/50 bg-slate-900'
                    : 'border-transparent bg-slate-900/40'
                }`}
              >
                <span
                  className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${
                    isAgent ? 'text-brand-teal' : 'text-brand-violet'
                  }`}
                >
                  {isAgent ? meta.agent.name : meta.callee.name}
                </span>
                <span className="text-slate-200">{meta.transcript[line.id]}</span>
              </li>
            )
          })}
        </ol>
      </details>
    </div>
  )
}
