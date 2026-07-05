import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'

interface CaptionProps {
  speakerLabel: string
  speaker: 'agent' | 'callee' | null
  text: string | null
  /** Line timing in track seconds + current playhead - drives the word cursor.
      When absent the caption renders as plain text. */
  start?: number
  duration?: number
  time?: number
}

interface WordWindow {
  word: string
  from: number
  to: number
}

/**
 * Estimate when each word of a line is spoken by spreading the line's measured
 * duration across its words, weighted by letter count. The manifest only times
 * whole lines (per-line clips), so word boundaries are an approximation - close
 * enough to read as a karaoke cursor without any word-level alignment data.
 */
function wordWindows(text: string, start: number, duration: number): WordWindow[] {
  const words = text.split(/\s+/).filter(Boolean)
  const weights = words.map((w) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length))
  const total = weights.reduce((sum, w) => sum + w, 0)
  let cursor = start
  return words.map((word, i) => {
    const from = cursor
    cursor += (weights[i] / total) * duration
    return { word, from, to: cursor }
  })
}

/**
 * The live caption for the currently-spoken line, rendered as one big centered
 * line of dialogue - cinematic subtitle, not a chat bubble. A karaoke-style
 * cursor follows the playhead: spoken words are lit, the word being said is
 * highlighted, upcoming words stay dim. The plain line lives in the
 * `aria-live="polite"` region (the highlighted copy is aria-hidden), so it works
 * with sound off and is announced to screen readers once per line change.
 */
export function Caption({ speakerLabel, speaker, text, start, duration, time }: CaptionProps) {
  const reduced = useReducedMotion()
  const tone = speaker === 'agent' ? 'text-brand-bright' : 'text-brand-blue'

  const windows =
    text !== null && start !== undefined && duration !== undefined && time !== undefined
      ? wordWindows(text, start, duration)
      : null
  const wordTransition = reduced ? '' : ' transition-colors duration-200'

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
            {windows && time !== undefined ? (
              <>
                <p
                  aria-hidden="true"
                  className="text-balance text-base font-medium leading-snug sm:text-lg"
                >
                  {windows.map((w, i) => (
                    <span key={i}>
                      {i > 0 ? ' ' : ''}
                      <span
                        className={
                          (time >= w.from && time < w.to
                            ? '-mx-0.5 rounded-sm bg-brand-bright/25 px-0.5 text-white'
                            : time >= w.to
                              ? 'text-slate-100'
                              : 'text-slate-400') + wordTransition
                        }
                      >
                        {w.word}
                      </span>
                    </span>
                  ))}
                </p>
                <p className="sr-only">{text}</p>
              </>
            ) : (
              <p className="text-balance text-base font-medium leading-snug text-slate-100 sm:text-lg">
                {text}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="text-sm text-slate-500">Lancez l’appel pour suivre la conversation.</p>
      )}
    </div>
  )
}
