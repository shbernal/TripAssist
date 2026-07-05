import type { ReactNode } from 'react'

// A labelled dashboard section that doubles as an onboarding spotlight target
// (its `id` is referenced by a TourStep). Semantic <section> + heading so the
// keyboard/screen-reader outline is clean.
export function Section({
  id,
  eyebrow,
  title,
  action,
  children,
}: {
  id: string
  eyebrow?: string
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  const headingId = `${id}-heading`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="min-w-0 scroll-mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold tracking-wide text-brand-bright uppercase">
              {eyebrow}
            </p>
          )}
          <h2 id={headingId} className="mt-1 text-xl font-semibold text-slate-100">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
