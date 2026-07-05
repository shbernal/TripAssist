import { useMemo } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'

interface WaveformProps {
  /** Bars animate only while the call is actually playing. */
  playing: boolean
  /** Tints the bars toward whoever is speaking. */
  speaker: 'agent' | 'callee' | null
  bars?: number
}

/**
 * A lightweight, decorative call waveform (aria-hidden - the captions carry the
 * real information). Pure CSS bars keep it reliable and cheap; it pulses while
 * playing and freezes to a static silhouette when paused or under reduced motion.
 */
export function Waveform({ playing, speaker, bars = 40 }: WaveformProps) {
  const reduced = useReducedMotion()
  const animate = playing && !reduced

  // Stable per-bar base heights + phases so the silhouette looks organic, not uniform.
  const seeds = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => ({
        base: 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7)),
        delay: (i % 7) * 90,
      })),
    [bars],
  )

  const color =
    speaker === 'agent'
      ? 'bg-brand-bright'
      : speaker === 'callee'
        ? 'bg-brand-blue'
        : 'bg-slate-600'

  return (
    <div aria-hidden="true" className="flex h-14 items-center justify-center gap-[3px]">
      {seeds.map((s, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full transition-colors ${color} ${animate ? 'wave-bar' : ''}`}
          style={{
            height: '100%',
            transform: `scaleY(${s.base})`,
            opacity: animate ? 0.9 : 0.45,
            animationDelay: animate ? `${s.delay}ms` : undefined,
          }}
        />
      ))}
    </div>
  )
}
