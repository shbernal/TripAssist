import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'

interface CaptionProps {
  speakerLabel: string
  speaker: 'agent' | 'callee' | null
  text: string | null
}

/**
 * The live caption for the currently-spoken line, rendered as one big centered
 * line of dialogue - cinematic subtitle, not a chat bubble. It is real DOM text
 * (not baked into the audio) with `aria-live="polite"`, so it works with sound
 * off and is announced to screen readers as the line changes.
 */
export function Caption({ speakerLabel, speaker, text }: CaptionProps) {
  const reduced = useReducedMotion()
  const tone = speaker === 'agent' ? 'text-brand-bright' : 'text-brand-blue'

  return (
    <div
      aria-live="polite"
      className="flex min-h-[6.5rem] flex-col items-center justify-center gap-1.5 text-center"
    >
      {text ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={text}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl"
          >
            <p className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tone}`}>
              {speakerLabel}
            </p>
            <p className="text-balance text-base font-medium leading-snug text-slate-100 sm:text-lg">
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
