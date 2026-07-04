import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SceneNavProps {
  onPrev: () => void
  onNext: () => void
}

/**
 * Fixed prev/next controls for the horizontal story. Keyboard-focusable buttons
 * with clear labels, so the scenes are reachable without a wheel or trackpad -
 * the horizontal layout must not strand keyboard users.
 */
export function SceneNav({ onPrev, onNext }: SceneNavProps) {
  const base =
    'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 shadow-lg backdrop-blur transition hover:border-brand-teal hover:text-brand-teal'
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex items-center justify-center gap-4">
      <button type="button" onClick={onPrev} className={base} aria-label="Scène précédente">
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <button type="button" onClick={onNext} className={base} aria-label="Scène suivante">
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  )
}
