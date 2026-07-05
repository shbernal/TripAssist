import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import type { Orientation } from '../lib/useStoryDeck'

interface SceneNavProps {
  count: number
  current: number
  orientation: Orientation
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
}

/**
 * Fixed prev/next controls plus one dot per scene. The arrows point the way the
 * deck actually travels - left/right on wide screens, up/down when the story is
 * stacked vertically on mobile - so the direction of movement reads at a glance.
 * Keyboard-focusable buttons with clear labels keep every scene reachable without
 * a wheel or trackpad.
 */
export function SceneNav({ count, current, orientation, onPrev, onNext, onSelect }: SceneNavProps) {
  const horizontal = orientation === 'horizontal'
  const Prev = horizontal ? ChevronLeft : ChevronUp
  const Next = horizontal ? ChevronRight : ChevronDown
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
        <Prev aria-hidden="true" className="h-4 w-4" />
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
        <Next aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
