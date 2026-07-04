import { motion } from 'framer-motion'
import { CheckCircle2, Plane, ShowerHead } from 'lucide-react'
import { useReducedMotion } from '../lib/useReducedMotion'

interface NotificationProps {
  title: string
  body: string
  kind: 'airport' | 'hotel'
  /** Stagger, in seconds, so the two banners land in sequence. */
  delay?: number
}

/**
 * An iOS-style lockscreen banner. Slides down with a soft haptic-style spring;
 * under reduced motion it simply appears.
 */
export function Notification({ title, body, kind, delay = 0 }: NotificationProps) {
  const reduced = useReducedMotion()
  const Icon = kind === 'airport' ? Plane : ShowerHead

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={
        reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18, delay }
      }
      className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/85 p-3 text-slate-900 shadow-lg backdrop-blur"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-violet text-white">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" />
        </div>
        <p className="mt-0.5 text-xs leading-snug text-slate-700">{body}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
          TripAssist · maintenant
        </p>
      </div>
    </motion.div>
  )
}
