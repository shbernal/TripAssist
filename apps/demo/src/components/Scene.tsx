import type { ReactNode } from 'react'

interface SceneProps {
  id: string
  /** Number badge, e.g. "02". */
  step?: string
  /** Small eyebrow label above the content. */
  eyebrow?: string
  /** Accessible heading text; rendered visually unless `hideHeading`. */
  heading: string
  hideHeading?: boolean
  children: ReactNode
}

/**
 * A full-viewport storytelling panel on the horizontal track. Every scene is a
 * landmark `<section>` with a real (optionally visually-hidden) heading so the
 * page has a coherent outline for screen readers and keyboard users. `tabIndex`
 * lets the scene receive focus when navigated to via an in-page anchor.
 *
 * Spacing is deliberately tight: every scene must fit a 720px-tall viewport
 * without vertical scrolling (overflow-y-auto stays as a safety net only).
 */
export function Scene({ id, step, eyebrow, heading, hideHeading, children }: SceneProps) {
  const headingId = `${id}-heading`
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={headingId}
      className="relative flex h-dvh w-screen shrink-0 overflow-y-auto px-6 pb-16 pt-8 outline-none sm:px-10"
    >
      <div className="m-auto w-full max-w-5xl">
        {(step || eyebrow) && (
          <div className="mb-3 flex items-center gap-3 text-xs sm:text-sm">
            {step ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand-bright/40 font-mono text-brand-bright">
                {step}
              </span>
            ) : null}
            {eyebrow ? (
              <span className="uppercase tracking-[0.2em] text-slate-500">{eyebrow}</span>
            ) : null}
          </div>
        )}
        <h2
          id={headingId}
          className={
            hideHeading
              ? 'sr-only'
              : 'mb-5 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl'
          }
        >
          {heading}
        </h2>
        {children}
      </div>
    </section>
  )
}
