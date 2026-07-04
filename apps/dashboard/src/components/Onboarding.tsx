import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, SkipForward, X } from 'lucide-react'

export interface TourStep {
  /** id of the section element to spotlight. */
  target: string
  eyebrow: string
  title: string
  body: string
}

interface Props {
  steps: TourStep[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}

// Guided onboarding: a coach-mark card stepping through the dashboard's aspects,
// spotlighting one section at a time. Focus is trapped in the card while open;
// Esc skips; ←/→ move. Fully keyboard-operable, aria-live announces each step.
export function Onboarding({ steps, index, onIndex, onClose }: Props) {
  const reduce = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const step = steps[index]
  const isLast = index === steps.length - 1

  const next = useCallback(() => {
    if (isLast) onClose()
    else onIndex(index + 1)
  }, [isLast, index, onIndex, onClose])

  const prev = useCallback(() => {
    if (index > 0) onIndex(index - 1)
  }, [index, onIndex])

  // Spotlight the current target: add the highlight class + scroll it into view.
  useEffect(() => {
    const el = document.getElementById(step.target)
    if (!el) return
    el.classList.add('tour-active')
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    return () => el.classList.remove('tour-active')
  }, [step.target, reduce])

  // Move initial focus into the card, and trap Tab within it while open.
  useEffect(() => {
    cardRef.current?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
      return
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = cardRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
    )
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-2xl border border-brand-bright/30 bg-slate-900/95 p-5 shadow-2xl shadow-brand-deep/30 backdrop-blur sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-brand-bright uppercase">
            {step.eyebrow}
          </p>
          <h2 id="tour-title" className="mt-1 text-lg font-semibold text-slate-100">
            {step.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Fermer la visite guidée"
        >
          <X className="h-5 w-5" aria-hidden={true} />
        </button>
      </div>

      {/* aria-live so screen readers announce each step's body as it changes. */}
      <p className="mt-2 text-sm leading-relaxed text-slate-300" aria-live="polite">
        {step.body}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500" aria-hidden={true}>
          Étape {index + 1} / {steps.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            <SkipForward className="h-4 w-4" aria-hidden={true} />
            Passer
          </button>
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden={true} />
            Précédent
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep"
          >
            {isLast ? (
              <>
                <Check className="h-4 w-4" aria-hidden={true} />
                Terminer
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4" aria-hidden={true} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress dots (decorative — the "Étape N / M" text above is the a11y source). */}
      <div className="mt-3 flex gap-1.5" aria-hidden={true}>
        {steps.map((s, i) => (
          <span
            key={s.target}
            className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-brand-bright' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    </motion.div>
  )
}

/** Wrap the tour card in AnimatePresence so it fades out on dismiss. */
export function OnboardingLayer(props: Props & { open: boolean }) {
  const { open, ...rest } = props
  return <AnimatePresence>{open && <Onboarding {...rest} />}</AnimatePresence>
}
