import { useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, useSpring } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useStoryDeck } from '../lib/useStoryDeck'
import { SceneNav } from '../components/SceneNav'
import { SCENE_IDS, StoryFlowContext, type SceneId } from './flow'
import { Hero } from './scenes/01-Hero'
import { Itinerary } from './scenes/02-Itinerary'
import { AirportCall } from './scenes/03-AirportCall'
import { HotelCall } from './scenes/04-HotelCall'
import { Notifications } from './scenes/05-Notifications'
import { Outro } from './scenes/06-Outro'
import { UseCases } from './scenes/07-UseCases'

/** How long a non-call scene holds before the story moves on by itself (ms).
    Call scenes advance when their audio ends; the use-cases scene is the
    resting state. */
const DWELL: Partial<Record<SceneId, number>> = {
  hero: 5000,
  itinerary: 7000,
  notifications: 7000,
  outro: 9000,
}

/**
 * The seven-scene story, driven as a discrete slide deck (see `useStoryDeck`).
 * Exactly one scene is active and the whole track is translated to it - sideways
 * on wide screens, vertically stacked on mobile. Every wheel notch, swipe, arrow
 * key, or dot moves one whole scene, so navigation is predictable and never
 * strands the viewer mid-scroll. The story also advances on its own (static
 * scenes dwell, call scenes hand off when the call ends); any user gesture
 * cancels the pending advance so autopilot never wrestles control away.
 *
 * Non-active scenes are made `inert` - kept in the DOM (and the reading order for
 * screen readers arrives with the active scene) but out of the tab order and
 * hidden from assistive tech, so keyboard focus can never land on an off-screen
 * control.
 */
export function Story() {
  const reduced = useReducedMotion()
  const mainRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelPending = useCallback((): void => {
    if (pendingRef.current !== null) {
      clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
  }, [])

  const { index, orientation, goTo } = useStoryDeck(SCENE_IDS.length, mainRef, {
    sceneIds: SCENE_IDS,
    onUserNavigate: cancelPending,
    reduced,
  })
  const indexRef = useRef(index)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  const horizontal = orientation === 'horizontal'

  // Top progress bar tracks how far through the story we are.
  const progress = useSpring(0, { stiffness: 120, damping: 30, restDelta: 0.001 })
  useEffect(() => {
    const value = SCENE_IDS.length > 1 ? index / (SCENE_IDS.length - 1) : 0
    if (reduced) progress.jump(value)
    else progress.set(value)
  }, [index, reduced, progress])

  // Take every scene except the active one out of the tab order / AT tree.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    Array.from(track.children).forEach((child, i) => {
      ;(child as HTMLElement).inert = i !== index
    })
  }, [index])

  // Autopilot: static scenes with a dwell time schedule the next scene. Off under
  // reduced motion - nothing moves without the user.
  useEffect(() => {
    cancelPending()
    if (reduced) return
    const dwell = DWELL[SCENE_IDS[index]]
    if (dwell === undefined) return
    pendingRef.current = setTimeout(() => goTo(index + 1), dwell)
    return cancelPending
  }, [index, reduced, cancelPending, goTo])

  const flow = useMemo(
    () => ({
      advanceFrom: (from: SceneId, delayMs = 1500): void => {
        if (reduced) return
        const at = SCENE_IDS.indexOf(from)
        if (at !== indexRef.current) return
        cancelPending()
        pendingRef.current = setTimeout(() => {
          if (indexRef.current === at) goTo(at + 1)
        }, delayMs)
      },
    }),
    [reduced, cancelPending, goTo],
  )

  const offset = `${-index * 100}${horizontal ? 'vw' : 'dvh'}`
  const trackStyle = {
    transform: horizontal ? `translate3d(${offset}, 0, 0)` : `translate3d(0, ${offset}, 0)`,
    transition: reduced ? 'none' : 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1)',
  }

  return (
    <StoryFlowContext.Provider value={flow}>
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-brand-deep to-brand-bright"
      />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="h-dvh w-screen overflow-clip outline-none"
      >
        <div
          ref={trackRef}
          style={trackStyle}
          className={`flex h-full w-max will-change-transform ${horizontal ? 'flex-row' : 'flex-col'}`}
        >
          <Hero />
          <Itinerary />
          <AirportCall active={index === 2} />
          <HotelCall active={index === 3} />
          <Notifications />
          <Outro />
          <UseCases />
        </div>
      </main>
      <SceneNav
        count={SCENE_IDS.length}
        current={index}
        orientation={orientation}
        onPrev={() => goTo(index - 1, { user: true })}
        onNext={() => goTo(index + 1, { user: true })}
        onSelect={(i) => goTo(i, { user: true })}
      />
    </StoryFlowContext.Provider>
  )
}
