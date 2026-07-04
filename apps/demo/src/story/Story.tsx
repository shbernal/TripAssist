import { motion, useScroll, useSpring } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useSmoothScroll } from '../lib/useSmoothScroll'
import { Hero } from './scenes/01-Hero'
import { Itinerary } from './scenes/02-Itinerary'
import { AirportCall } from './scenes/03-AirportCall'
import { HotelCall } from './scenes/04-HotelCall'
import { Notifications } from './scenes/05-Notifications'
import { Outro } from './scenes/06-Outro'

/**
 * The scroll-driven six-scene story. Lenis + GSAP power the smooth scroll (off
 * under reduced motion); a slim gradient bar tracks reading progress.
 */
export function Story() {
  const reduced = useReducedMotion()
  useSmoothScroll(!reduced)

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ scaleX: reduced ? 1 : scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-brand-teal to-brand-violet"
      />
      <main id="main">
        <Hero />
        <Itinerary />
        <AirportCall />
        <HotelCall />
        <Notifications />
        <Outro />
      </main>
    </>
  )
}
