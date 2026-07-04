import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useSmoothScroll } from '../lib/useSmoothScroll'
import { SceneNav } from '../components/SceneNav'
import { SCENE_IDS, StoryFlowContext, type SceneId } from './flow'
import { Hero } from './scenes/01-Hero'
import { Itinerary } from './scenes/02-Itinerary'
import { AirportCall } from './scenes/03-AirportCall'
import { HotelCall } from './scenes/04-HotelCall'
import { Notifications } from './scenes/05-Notifications'
import { Outro } from './scenes/06-Outro'

/** How long a non-call scene holds before the story moves on by itself (ms).
    Call scenes advance when their audio ends; the outro is the resting state. */
const DWELL: Partial<Record<SceneId, number>> = {
  hero: 5000,
  itinerary: 7000,
  notifications: 7000,
}

/**
 * The horizontal six-scene story. Scenes sit side by side on a single track that
 * scrolls sideways from a vertical wheel (Lenis + its Snap plugin - no CSS
 * scroll-snap, the two fight). The story also advances on its own: static scenes
 * dwell a few seconds, call scenes move on when the call ends. Any user gesture
 * cancels the pending advance, so autopilot never wrestles the wheel away.
 */
export function Story() {
  const reduced = useReducedMotion()
  const mainRef = useRef<HTMLElement>(null)
  const { scrollToIndex } = useSmoothScroll(mainRef, !reduced)

  const [current, setCurrent] = useState(0)
  const currentRef = useRef(0)
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { scrollXProgress } = useScroll({ container: mainRef })
  const scaleX = useSpring(scrollXProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  const cancelPending = useCallback((): void => {
    if (pendingRef.current !== null) {
      clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
  }, [])

  const goTo = useCallback(
    (index: number): void => {
      cancelPending()
      scrollToIndex(Math.min(Math.max(index, 0), SCENE_IDS.length - 1))
    },
    [cancelPending, scrollToIndex],
  )

  // Track which scene the viewport is on.
  useEffect(() => {
    const wrapper = mainRef.current
    if (!wrapper) return
    const onScroll = (): void => {
      const index = Math.round(wrapper.scrollLeft / wrapper.clientWidth)
      if (index !== currentRef.current) {
        currentRef.current = index
        setCurrent(index)
      }
    }
    wrapper.addEventListener('scroll', onScroll, { passive: true })
    return () => wrapper.removeEventListener('scroll', onScroll)
  }, [])

  // Autopilot: when the story settles on a scene with a dwell time, schedule the
  // next scene. Off under reduced motion - nothing moves without the user.
  useEffect(() => {
    cancelPending()
    if (reduced) return
    const dwell = DWELL[SCENE_IDS[current]]
    if (dwell === undefined) return
    pendingRef.current = setTimeout(() => scrollToIndex(current + 1), dwell)
    return cancelPending
  }, [current, reduced, cancelPending, scrollToIndex])

  // Any real user gesture takes priority over a scheduled advance.
  useEffect(() => {
    const wrapper = mainRef.current
    if (!wrapper) return
    const cancel = (): void => cancelPending()
    wrapper.addEventListener('wheel', cancel, { passive: true })
    wrapper.addEventListener('pointerdown', cancel, { passive: true })
    window.addEventListener('keydown', cancel)
    return () => {
      wrapper.removeEventListener('wheel', cancel)
      wrapper.removeEventListener('pointerdown', cancel)
      window.removeEventListener('keydown', cancel)
    }
  }, [cancelPending])

  const flow = useMemo(
    () => ({
      advanceFrom: (from: SceneId, delayMs = 1500): void => {
        if (reduced) return
        const index = SCENE_IDS.indexOf(from)
        if (index !== currentRef.current) return
        cancelPending()
        pendingRef.current = setTimeout(() => {
          if (currentRef.current === index) scrollToIndex(index + 1)
        }, delayMs)
      },
    }),
    [reduced, cancelPending, scrollToIndex],
  )

  return (
    <StoryFlowContext.Provider value={flow}>
      <motion.div
        aria-hidden="true"
        style={{ scaleX: reduced ? scrollXProgress : scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-brand-deep to-brand-bright"
      />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="h-dvh w-screen overflow-x-auto overflow-y-hidden overscroll-x-contain outline-none"
      >
        <div className="flex h-full w-max">
          <Hero />
          <Itinerary />
          <AirportCall />
          <HotelCall />
          <Notifications />
          <Outro />
        </div>
      </main>
      <SceneNav
        count={SCENE_IDS.length}
        current={current}
        onPrev={() => goTo(current - 1)}
        onNext={() => goTo(current + 1)}
        onSelect={goTo}
      />
    </StoryFlowContext.Provider>
  )
}
