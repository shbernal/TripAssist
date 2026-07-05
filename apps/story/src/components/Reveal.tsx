import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'

interface RevealProps {
  children: ReactNode
  /** Stagger, in seconds, for sequential reveals within a scene. */
  delay?: number
  className?: string
  /** Slide-in direction. */
  from?: 'up' | 'down' | 'left' | 'right'
}

const OFFSET = 28

/**
 * Enter animation on scroll-into-view. Under `prefers-reduced-motion` it renders
 * the final state immediately (no transform, no fade) so content is never gated
 * behind motion.
 */
export function Reveal({ children, delay = 0, className, from = 'up' }: RevealProps) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  const initial =
    from === 'up'
      ? { opacity: 0, y: OFFSET }
      : from === 'down'
        ? { opacity: 0, y: -OFFSET }
        : from === 'left'
          ? { opacity: 0, x: OFFSET }
          : { opacity: 0, x: -OFFSET }

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
