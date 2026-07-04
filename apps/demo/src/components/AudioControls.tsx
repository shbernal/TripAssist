import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import type { CallPlayer } from '../lib/useCallPlayer'

/**
 * Visible transport for a call - deliberately quiet chrome: three small
 * icon-only buttons (play/pause, restart, mute) tucked in the card header. The
 * call drives itself; these exist for control, not for attention. Audio never
 * plays without one of these controls (or an explicit in-view trigger); sound
 * is always opt-in and mutable.
 */
export function AudioControls({ player }: { player: CallPlayer }) {
  const isPlaying = player.status === 'playing'
  const disabled = player.status === 'loading' || player.status === 'error'

  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/50 text-slate-400 transition-colors hover:border-brand-bright/60 hover:text-brand-bright disabled:opacity-40'

  const playLabel = isPlaying
    ? 'Pause'
    : player.status === 'ended'
      ? 'Réécouter'
      : 'Écouter l’appel'

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={player.toggle}
        disabled={disabled}
        aria-label={playLabel}
        title={playLabel}
        className={btn}
      >
        {isPlaying ? (
          <Pause aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Play aria-hidden="true" className="h-3.5 w-3.5" />
        )}
      </button>

      <button
        type="button"
        onClick={player.replay}
        disabled={disabled}
        aria-label="Recommencer l’appel"
        title="Recommencer"
        className={btn}
      >
        <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={player.toggleMute}
        disabled={disabled}
        aria-pressed={player.muted}
        aria-label={player.muted ? 'Réactiver le son' : 'Couper le son'}
        title={player.muted ? 'Réactiver le son' : 'Couper le son'}
        className={btn}
      >
        {player.muted ? (
          <VolumeX aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Volume2 aria-hidden="true" className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
