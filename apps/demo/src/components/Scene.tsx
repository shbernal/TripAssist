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
 * A full-height storytelling section. Every scene is a landmark `<section>` with
 * a real (optionally visually-hidden) heading so the page has a coherent outline
 * for screen readers and keyboard users.
 */
export function Scene({ id, step, eyebrow, heading, hideHeading, children }: SceneProps) {
  const headingId = `${id}-heading`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="relative flex min-h-screen flex-col justify-center px-6 py-24 sm:px-10"
    >
      <div className="mx-auto w-full max-w-5xl">
        {(step || eyebrow) && (
          <div className="mb-4 flex items-center gap-3 text-sm">
            {step ? (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-teal/40 font-mono text-brand-teal">
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
              : 'mb-8 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl'
          }
        >
          {heading}
        </h2>
        {children}
      </div>
    </section>
  )
}
