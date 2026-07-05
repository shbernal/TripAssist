import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export type Orientation = 'horizontal' | 'vertical'

/** Below this width the deck stacks and moves vertically (mobile). */
const HORIZONTAL_MIN = '(min-width: 768px)'
/** How far a wheel/touch gesture must travel before it counts as one step. */
const WHEEL_THRESHOLD = 24
const SWIPE_THRESHOLD = 44
/** After a step, ignore further gestures until the transition has settled. */
const LOCK_MS = 620
const LOCK_MS_REDUCED = 60

export interface StoryDeck {
  index: number
  orientation: Orientation
  /** Move to a scene index. `user` marks a human gesture (cancels autopilot). */
  goTo: (to: number, opts?: { user?: boolean }) => void
}

interface Options {
  /** Scene ids in order, used to route in-page anchors to a scene. */
  sceneIds: readonly string[]
  /** Fired on any human-driven navigation, so callers can cancel autopilot. */
  onUserNavigate?: () => void
  /** Pass `reducedMotion` - shortens the gesture lock so nav stays responsive. */
  reduced: boolean
}

function currentOrientation(): Orientation {
  if (typeof window === 'undefined') return 'horizontal'
  return window.matchMedia(HORIZONTAL_MIN).matches ? 'horizontal' : 'vertical'
}

/**
 * Drives the story as a discrete slide deck rather than a free scroller. Exactly
 * one scene is active; every wheel notch, swipe, arrow key, or anchor click moves
 * the deck by whole scenes - no momentum, no half-scrolled states, no fighting a
 * snap engine. The deck travels sideways on wide screens and stacks vertically on
 * mobile (the axis both the wheel and swipe read follows that orientation).
 *
 * The caller owns the actual transform (it knows the layout); this hook only owns
 * *which* scene is active and translates raw input into step intents.
 *
 * @param count number of scenes.
 * @param containerRef the deck viewport - gestures are bound here.
 */
export function useStoryDeck(
  count: number,
  containerRef: RefObject<HTMLElement | null>,
  { sceneIds, onUserNavigate, reduced }: Options,
): StoryDeck {
  const [index, setIndex] = useState(0)
  const [orientation, setOrientation] = useState<Orientation>(currentOrientation)

  const indexRef = useRef(0)
  const orientationRef = useRef(orientation)
  const lockUntilRef = useRef(0)
  const reducedRef = useRef(reduced)

  // Mirror the latest render values into refs the event handlers read.
  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])
  useEffect(() => {
    orientationRef.current = orientation
  }, [orientation])

  const goTo = useCallback<StoryDeck['goTo']>(
    (to, opts) => {
      const clamped = Math.min(Math.max(to, 0), count - 1)
      lockUntilRef.current = performance.now() + (reducedRef.current ? LOCK_MS_REDUCED : LOCK_MS)
      if (opts?.user) onUserNavigate?.()
      if (clamped === indexRef.current) return
      indexRef.current = clamped
      setIndex(clamped)
    },
    [count, onUserNavigate],
  )

  const step = useCallback(
    (dir: 1 | -1): void => {
      onUserNavigate?.()
      goTo(indexRef.current + dir)
    },
    [goTo, onUserNavigate],
  )

  const locked = (): boolean => performance.now() < lockUntilRef.current

  // Track orientation (wide = horizontal, narrow = vertical stack).
  useEffect(() => {
    const mq = window.matchMedia(HORIZONTAL_MIN)
    const sync = (): void => setOrientation(mq.matches ? 'horizontal' : 'vertical')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Wheel + touch: turn a gesture into a single step along the active axis.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent): void => {
      // The deck clips its overflow, so there is nothing native to scroll -
      // claim the gesture and translate it into at most one step.
      e.preventDefault()
      if (locked()) return
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (Math.abs(delta) < WHEEL_THRESHOLD) return
      step(delta > 0 ? 1 : -1)
    }

    let startX = 0
    let startY = 0
    const onTouchStart = (e: TouchEvent): void => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent): void => {
      if (locked()) return
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      // Read the axis the deck actually travels on, so a stray cross-swipe is
      // ignored rather than jumping scenes.
      const along = orientationRef.current === 'horizontal' ? dx : dy
      const across = orientationRef.current === 'horizontal' ? dy : dx
      if (Math.abs(along) < SWIPE_THRESHOLD || Math.abs(along) <= Math.abs(across)) return
      step(along < 0 ? 1 : -1) // swipe left/up advances
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [containerRef, step])

  // Keyboard: arrows / page / home / end move the deck. Skipped while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault()
          step(1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          step(-1)
          break
        case 'Home':
          e.preventDefault()
          goTo(0, { user: true })
          break
        case 'End':
          e.preventDefault()
          goTo(count - 1, { user: true })
          break
        default:
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, goTo, count])

  // Route in-page anchors (hero CTA, etc.) to their scene instead of a jump the
  // deck layout cannot honor. The skip link (#main) is left to focus natively.
  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      const anchor = (e.target as Element | null)?.closest('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')?.slice(1)
      if (!id) return
      const to = sceneIds.indexOf(id)
      if (to < 0) return
      e.preventDefault()
      goTo(to, { user: true })
      document.getElementById(id)?.focus({ preventScroll: true })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [sceneIds, goTo])

  return { index, orientation, goTo }
}
