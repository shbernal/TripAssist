import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import Lenis from 'lenis'
import Snap from 'lenis/snap'

interface HorizontalScroll {
  /** Scroll the track to a scene index (0-based). */
  scrollToIndex: (index: number) => void
}

/**
 * Turns a horizontally-overflowing container into the story's single scroller:
 * a vertical wheel gesture moves the scenes sideways. Lenis provides the buttery
 * inertia (orientation horizontal, gesture read from the vertical wheel) and its
 * Snap plugin settles on whole scenes - CSS scroll-snap must stay OFF on the
 * container, the two animation systems fight and the result stutters. Under
 * reduced motion Lenis is skipped and a tiny native handler maps the wheel to an
 * instant horizontal scroll, so the page is still navigable with no animation.
 *
 * It also intercepts in-page hash links (e.g. the hero CTA) so they scroll the
 * track sideways instead of doing a vertical jump the layout cannot honor.
 *
 * @param containerRef the horizontal scroller element.
 * @param smooth pass `!reducedMotion` from the caller.
 */
export function useSmoothScroll(
  containerRef: RefObject<HTMLElement | null>,
  smooth: boolean,
): HorizontalScroll {
  const lenisRef = useRef<Lenis | null>(null)

  const scrollToIndex = useCallback(
    (index: number): void => {
      const wrapper = containerRef.current
      if (!wrapper) return
      const left = index * wrapper.clientWidth
      if (lenisRef.current) {
        lenisRef.current.scrollTo(left, { duration: 1.4 })
      } else {
        wrapper.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
      }
    },
    [containerRef, smooth],
  )

  useEffect(() => {
    const wrapper = containerRef.current
    if (!wrapper) return

    if (!smooth) {
      // Reduced motion: no inertia, just map the vertical wheel to the axis that
      // actually scrolls so navigation still works.
      const onWheel = (e: WheelEvent): void => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
        wrapper.scrollLeft += e.deltaY
        e.preventDefault()
      }
      wrapper.addEventListener('wheel', onWheel, { passive: false })
      return () => wrapper.removeEventListener('wheel', onWheel)
    }

    const content = wrapper.firstElementChild as HTMLElement | null
    if (!content) return

    const lenis = new Lenis({
      wrapper,
      content,
      orientation: 'horizontal',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      duration: 1.4,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })
    lenisRef.current = lenis

    // Always settle on a whole scene, softly, once the gesture ends.
    const snap = new Snap(lenis, { type: 'mandatory', duration: 0.9, debounce: 300 })
    snap.addElements(Array.from(content.children) as HTMLElement[], { align: 'start' })

    let raf = 0
    const loop = (time: number): void => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      snap.destroy()
      lenis.destroy()
      lenisRef.current = null
    }
  }, [containerRef, smooth])

  // Route in-page anchors (hero CTA, etc.) through the horizontal scroller.
  useEffect(() => {
    const wrapper = containerRef.current
    if (!wrapper) return

    const onClick = (e: MouseEvent): void => {
      const anchor = (e.target as Element | null)?.closest('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')?.slice(1)
      if (!id) return
      const target = document.getElementById(id)
      // Skip the container itself (e.g. the skip link) so focus can move natively.
      if (!target || target === wrapper || !wrapper.contains(target)) return
      e.preventDefault()
      const left =
        wrapper.scrollLeft +
        target.getBoundingClientRect().left -
        wrapper.getBoundingClientRect().left
      scrollToIndex(Math.round(left / wrapper.clientWidth))
      target.focus({ preventScroll: true })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [containerRef, scrollToIndex])

  return { scrollToIndex }
}
