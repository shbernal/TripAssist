import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Buttery inertia scroll (Lenis) wired into GSAP's ticker so ScrollTrigger stays
 * in sync with it. Disabled entirely when the user prefers reduced motion — then
 * the page is plain native scroll with no inertia.
 *
 * @param enabled pass `!reducedMotion` from the caller.
 */
export function useSmoothScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    })

    // Keep ScrollTrigger's cached positions in step with Lenis' virtual scroll.
    lenis.on('scroll', ScrollTrigger.update)

    const onTick = (time: number): void => {
      // gsap.ticker time is seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [enabled])
}
