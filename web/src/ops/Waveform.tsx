import React, { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

interface WaveformProps {
  /** Bars pulse only while the call is actually in progress. */
  playing: boolean
  /** Tints the bars toward whoever is currently speaking. */
  speaker: 'assistant' | 'human' | null
  bars?: number
}

/**
 * A lightweight, decorative call waveform (aria-hidden - the transcript carries
 * the real information). Pure CSS bars keep it cheap and reliable: they pulse
 * while the call is live and freeze to a static silhouette when idle/ended or
 * under prefers-reduced-motion. Mirrors the Camille-story waveform on the
 * concept branch so the two demos feel like one product.
 */
export default function Waveform({ playing, speaker, bars = 28 }: WaveformProps) {
  const reduced = useReducedMotion()
  const animate = playing && !reduced

  // Stable per-bar base heights + phases so the silhouette looks organic, not
  // uniform. Seeded from a cheap sine so it is deterministic across renders.
  const seeds = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => ({
        base: 0.28 + 0.72 * Math.abs(Math.sin(i * 1.7)),
        delay: (i % 7) * 90,
      })),
    [bars],
  )

  return (
    <div
      className="wave"
      aria-hidden="true"
      data-speaker={speaker ?? 'none'}
      data-playing={playing ? 'true' : 'false'}
    >
      {seeds.map((s, i) => (
        <span
          key={i}
          className={`wave-bar ${animate ? 'is-animated' : ''}`}
          style={{
            transform: `scaleY(${s.base})`,
            opacity: animate ? 0.95 : 0.4,
            animationDelay: animate ? `${s.delay}ms` : undefined,
          }}
        />
      ))}
    </div>
  )
}
