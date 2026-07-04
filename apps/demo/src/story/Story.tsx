import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useSmoothScroll } from '../lib/useSmoothScroll'
import { SceneNav } from '../components/SceneNav'
import { Hero } from './scenes/01-Hero'
import { Itinerary } from './scenes/02-Itinerary'
import { AirportCall } from './scenes/03-AirportCall'
import { HotelCall } from './scenes/04-HotelCall'
import { Notifications } from './scenes/05-Notifications'
import { Outro } from './scenes/06-Outro'

const SCENE_COUNT = 6

/**
 * The horizontal six-scene story. Scenes sit side by side on a single track that
 * scrolls sideways from a vertical wheel (Lenis, off under reduced motion). A slim
 * gradient bar tracks reading progress; prev/next controls keep it keyboard-usable.
 */
export function Story() {
  const reduced = useReducedMotion()
  const mainRef = useRef<HTMLElement>(null)
  const { scrollToLeft } = useSmoothScroll(mainRef, !reduced)

  const { scrollXProgress } = useScroll({ container: mainRef })
  const scaleX = useSpring(scrollXProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  const navigate = (dir: -1 | 1): void => {
    const wrapper = mainRef.current
    if (!wrapper) return
    const width = wrapper.clientWidth
    const index = Math.round(wrapper.scrollLeft / width)
    const next = Math.min(Math.max(index + dir, 0), SCENE_COUNT - 1)
    scrollToLeft(next * width)
  }

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ scaleX: reduced ? scrollXProgress : scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-brand-teal to-brand-violet"
      />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="h-dvh w-screen snap-x snap-proximity overflow-x-auto overflow-y-hidden overscroll-x-contain outline-none"
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
      <SceneNav onPrev={() => navigate(-1)} onNext={() => navigate(1)} />
    </>
  )
}
