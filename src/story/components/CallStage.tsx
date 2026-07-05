import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, PhoneCall, Play } from 'lucide-react'
import { asset } from '../lib/asset'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useCallPlayer } from '../lib/useCallPlayer'
import { useStoryFlow } from '../story/flow'
import { CALLS, type CallId } from '../story/calls'
import { AudioControls } from './AudioControls'
import { Caption } from './Caption'
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
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={reduced ? undefined : { scale: speaking ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative rounded-full ${speaking ? 'ring-4 ring-brand-bright/70' : 'ring-2 ring-slate-700'}`}
      >
        {speaking && !reduced ? (
          <span className="absolute -inset-1 animate-ping rounded-full bg-brand-bright/30" />
        ) : null}
        <img
          src={asset(src)}
          alt={name}
          className="relative h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
        />
      </motion.div>
      {/* On phones the full name wraps and dwarfs the orb; the role alone identifies
          the speaker (the img alt keeps the name for screen readers). */}
      <p className="hidden text-sm font-semibold text-slate-100 sm:block">{name}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 sm:text-slate-500">
        {role}
      </p>
    </div>
  )
}

/**
 * The animated phone-call stage for scenes 3 & 4: agent avatar ↔ callee, a live
 * waveform, the synced caption, and short "milestone" facts that stamp in as the
 * call secures them - the impactful skeleton of the conversation instead of a
 * scrolling transcript (the verbatim dialogue stays in the DOM for screen
 * readers). When the call ends the outcome stamps in and the story advances on
 * its own.
 *
 * `active` is true only while this scene is the one on screen. It gates the
 * audio lifecycle: the call never blares on its own - a tap-to-start overlay
 * sits over the stage until the viewer chooses to listen. Once started, the
 * deck takes over: the call pauses the moment we move to another slide (so it
 * never talks over the next scene) and resumes on return.
 */
export function CallStage({ callId, active }: { callId: CallId; active: boolean }) {
  const meta = CALLS[callId]
  const player = useCallPlayer(callId)
  const reduced = useReducedMotion()
  const flow = useStoryFlow()
  const advancedRef = useRef(false)
  // The call stays silent behind a transparent overlay until the viewer taps it.
  // We don't autoplay - only a deliberate gesture starts the conversation.
  const [started, setStarted] = useState(false)

  // Once the viewer has started the call, playback follows the active scene:
  // resume on return, pause on departure. A pause the *user* asked for
  // (userPaused) is never overridden - only deck-driven pauses auto-resume.
  const { status: callStatus, userPaused, play: playCall, pause: pauseCall } = player
  useEffect(() => {
    if (!started) return
    if (active) {
      if (callStatus === 'paused' && !userPaused) playCall()
    } else if (callStatus === 'playing') {
      pauseCall()
    }
  }, [started, active, callStatus, userPaused, playCall, pauseCall])

  // Tapping the overlay both dismisses it and kicks off the conversation. The
  // tap is a user gesture, so autoplay is never in question here.
  const startCall = (): void => {
    setStarted(true)
    playCall()
  }

  // Space toggles the call audio while this scene is on screen. Presses aimed
  // at an interactive element are left alone (a focused button already treats
  // Space as a click - handling it here too would double-toggle).
  const { toggle: toggleCall } = player
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== ' ') return
      const t = e.target as HTMLElement | null
      if (t?.closest('button, a, input, textarea, select, [contenteditable]')) return
      e.preventDefault()
      toggleCall()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, toggleCall])

  const ended = player.status === 'ended'

  // Hand the story forward once the call has resolved (after a short beat so
  // the confirmation stamp can land).
  useEffect(() => {
    if (!ended || advancedRef.current) return
    advancedRef.current = true
    flow.advanceFrom(callId, 2200)
  }, [ended, flow, callId])

  const activeLine = player.manifest?.lines.find((l) => l.id === player.activeLineId)
  const activeText = activeLine ? (activeLine.text ?? meta.transcript[activeLine.id]) : null
  const speakerLabel = player.activeSpeaker === 'agent' ? meta.agent.name : meta.callee.name
  const outcome = player.manifest?.outcome
  const passedId = player.activeLineId ?? 0
  const stamps = Object.entries(meta.milestones)
    .map(([id, label]) => ({ id: Number(id), label }))
    .filter((m) => (ended ? true : m.id <= passedId))

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-2xl backdrop-blur sm:p-6">
      {/* Tap-to-start overlay: a transparent scrim over the whole conversation
          until the viewer chooses to listen. Nothing plays before this tap. */}
      <AnimatePresence>
        {!started ? (
          <motion.button
            type="button"
            onClick={startCall}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.25 } }}
            aria-label={`Écouter ${meta.title}`}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-slate-950/50 text-slate-100 backdrop-blur-sm transition-colors hover:bg-slate-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            <motion.span
              animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-bright/90 text-slate-950 shadow-lg shadow-brand-bright/30"
            >
              <Play aria-hidden="true" className="ml-0.5 h-7 w-7" />
            </motion.span>
            <span className="text-sm font-semibold sm:text-base">Écouter la conversation</span>
            <span className="text-xs text-slate-300">{meta.title}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-400">
          <PhoneCall aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-bright" />
          <span className="truncate">{meta.title}</span>
        </div>
        <AudioControls player={player} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <Avatar
          src={meta.agent.face}
          name={meta.agent.name}
          role="Agent IA"
          speaking={player.activeSpeaker === 'agent'}
          reduced={reduced}
        />
        <div className="w-28 sm:w-48">
          <Waveform
            playing={player.status === 'playing'}
            speaker={player.activeSpeaker}
            bars={24}
          />
        </div>
        <Avatar
          src={meta.callee.face}
          name={meta.callee.name}
          role={callId === 'airport-call' ? 'Aéroport' : 'Hôtel'}
          speaking={player.activeSpeaker === 'callee'}
          reduced={reduced}
        />
      </div>

      <div
        className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label="Progression de l’appel"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(player.progress * 100)}
      >
        <div
          className="h-full bg-gradient-to-r from-brand-deep to-brand-bright transition-[width] duration-150"
          style={{ width: `${player.progress * 100}%` }}
        />
      </div>

      <div className="mt-4">
        <Caption
          speakerLabel={speakerLabel}
          speaker={player.activeSpeaker}
          text={activeText}
          start={activeLine?.start}
          duration={activeLine?.duration}
          time={player.time}
        />
      </div>

      {/* Secured facts stamp in as the call locks them down. */}
      <ul className="mt-4 flex min-h-[2.25rem] flex-wrap items-center justify-center gap-2">
        <AnimatePresence>
          {stamps.map((m) => (
            <motion.li
              key={m.id}
              initial={reduced ? false : { opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-bright"
            >
              <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
              {m.label}
            </motion.li>
          ))}
          {ended && outcome ? (
            <motion.li
              key="outcome"
              initial={reduced ? false : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200"
            >
              <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Confirmé · {outcome.reference}
            </motion.li>
          ) : null}
        </AnimatePresence>
      </ul>

      {/* Verbatim dialogue, for screen-reader users who don't play the audio. */}
      <ol className="sr-only">
        {player.manifest?.lines.map((line) => (
          <li key={line.id}>
            {(line.speaker === 'agent' ? meta.agent.name : meta.callee.name) + ' : '}
            {line.text ?? meta.transcript[line.id]}
          </li>
        ))}
      </ol>
    </div>
  )
}
