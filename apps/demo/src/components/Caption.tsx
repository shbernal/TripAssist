import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'

interface CaptionProps {
  speakerLabel: string
  speaker: 'agent' | 'callee' | null
  text: string | null
}

/**
 * The live caption for the currently-spoken line. It is real DOM text (not baked
 * into the audio) with `aria-live="polite"`, so it works with sound off and is
 * announced to screen readers as the line changes.
 */
export function Caption({ speakerLabel, speaker, text }: CaptionProps) {
  const reduced = useReducedMotion()
  const align = speaker === 'agent' ? 'items-start text-left' : 'items-end text-right'
  const bubble =
    speaker === 'agent'
      ? 'bg-brand-teal/15 border-brand-teal/30'
      : 'bg-brand-violet/15 border-brand-violet/30'

  return (
    <div aria-live="polite" className={`flex min-h-[7rem] flex-col justify-center gap-2 ${align}`}>
      {text ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={text}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="max-w-lg"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {speakerLabel}
            </p>
            <p
              className={`rounded-2xl border px-4 py-3 text-base leading-relaxed text-slate-100 ${bubble}`}
            >
              {text}
            </p>
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="text-sm text-slate-500">Lancez l’appel pour suivre la conversation.</p>
      )}
    </div>
  )
}
