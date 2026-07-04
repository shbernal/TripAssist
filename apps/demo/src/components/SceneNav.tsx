import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SceneNavProps {
  count: number
  current: number
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
}

/**
 * Fixed prev/next controls plus one dot per scene. Keyboard-focusable buttons
 * with clear labels, so the scenes are reachable without a wheel or trackpad -
 * the horizontal layout must not strand keyboard users.
 */
export function SceneNav({ count, current, onPrev, onNext, onSelect }: SceneNavProps) {
  const arrow =
    'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/70 text-slate-300 shadow-lg backdrop-blur transition hover:border-brand-bright hover:text-brand-bright disabled:opacity-30 disabled:hover:border-slate-700/70 disabled:hover:text-slate-300'
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={current === 0}
        className={arrow}
        aria-label="Scène précédente"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/70 px-3 py-2 backdrop-blur">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Scène ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 bg-gradient-to-r from-brand-deep to-brand-bright'
                : 'w-2 bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={current === count - 1}
        className={arrow}
        aria-label="Scène suivante"
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
