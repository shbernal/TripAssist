import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import type { CallPlayer } from '../lib/useCallPlayer'

/**
 * Visible transport for a call. Audio never plays without one of these controls
 * (or an explicit in-view trigger); sound is always opt-in and mutable.
 */
export function AudioControls({ player }: { player: CallPlayer }) {
  const isPlaying = player.status === 'playing'
  const disabled = player.status === 'loading' || player.status === 'error'

  const btn =
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={player.toggle}
        disabled={disabled}
        className={`${btn} border-brand-teal/50 bg-brand-teal/15 text-brand-teal hover:bg-brand-teal/25`}
      >
        {isPlaying ? (
          <Pause aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Play aria-hidden="true" className="h-4 w-4" />
        )}
        {isPlaying ? 'Pause' : player.status === 'ended' ? 'Réécouter' : 'Écouter l’appel'}
      </button>

      <button
        type="button"
        onClick={player.replay}
        disabled={disabled}
        className={`${btn} border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800`}
      >
        <RotateCcw aria-hidden="true" className="h-4 w-4" />
        Recommencer
      </button>

      <button
        type="button"
        onClick={player.toggleMute}
        disabled={disabled}
        aria-pressed={player.muted}
        className={`${btn} border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800`}
      >
        {player.muted ? (
          <VolumeX aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Volume2 aria-hidden="true" className="h-4 w-4" />
        )}
        {player.muted ? 'Réactiver le son' : 'Couper le son'}
      </button>
    </div>
  )
}
