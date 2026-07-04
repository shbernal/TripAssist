import { useCallback, useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { asset } from './asset'
import type { CallId, Speaker } from '../story/calls'

export interface ManifestLine {
  id: number
  speaker: Speaker
  caption: string
  file: string
  start: number
  duration: number
}

export interface CallOutcome {
  status: string
  reference: string
  summary: string
  notification: { title: string; body: string }
}

export interface CallManifest {
  id: string
  title: string
  locale: string
  totalDuration: number
  track: string
  lines: ManifestLine[]
  outcome: CallOutcome
}

export type CallStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'

export interface CallPlayer {
  status: CallStatus
  manifest: CallManifest | null
  /** Currently-speaking line, or the last one once ended. */
  activeLineId: number | null
  activeSpeaker: Speaker | null
  /** 0..1 across the whole conversation. */
  progress: number
  muted: boolean
  play: () => void
  pause: () => void
  toggle: () => void
  replay: () => void
  toggleMute: () => void
}

function activeIndexAt(lines: ManifestLine[], t: number): number {
  let idx = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].start <= t) idx = i
    else break
  }
  return idx
}

/**
 * Loads a call's timing manifest and drives its stitched `conversation.mp3` with
 * Howler. All caption/waveform sync is derived from `currentTime` against the
 * manifest - no hand-authored timing. Audio is opt-in: nothing plays until the
 * caller invokes `play()` (from a visible control or an in-view trigger).
 */
export function useCallPlayer(callId: CallId): CallPlayer {
  const [manifest, setManifest] = useState<CallManifest | null>(null)
  const [status, setStatus] = useState<CallStatus>('loading')
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(false)

  const howlRef = useRef<Howl | null>(null)
  const rafRef = useRef<number | null>(null)
  const manifestRef = useRef<CallManifest | null>(null)

  // Fetch the manifest.
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetch(asset(`audio/${callId}/manifest.json`))
      .then((r) => {
        if (!r.ok) throw new Error(`manifest ${r.status}`)
        return r.json() as Promise<CallManifest>
      })
      .then((m) => {
        if (cancelled) return
        manifestRef.current = m
        setManifest(m)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [callId])

  // Build the Howl once the manifest (and thus the track path) is known.
  useEffect(() => {
    if (!manifest) return
    const howl = new Howl({
      src: [asset(manifest.track)],
      html5: true,
      preload: true,
      onend: () => {
        stopRaf()
        setActiveIndex(manifest.lines.length - 1)
        setProgress(1)
        setStatus('ended')
      },
      onplayerror: () => {
        // Autoplay was blocked (no user gesture yet); wait for an explicit play.
        setStatus('paused')
      },
    })
    howlRef.current = howl
    return () => {
      stopRaf()
      howl.unload()
      howlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest])

  const stopRaf = (): void => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const tick = useCallback((): void => {
    const howl = howlRef.current
    const m = manifestRef.current
    if (!howl || !m) return
    const raw = howl.seek()
    const t = typeof raw === 'number' ? raw : 0
    setActiveIndex(activeIndexAt(m.lines, t))
    setProgress(m.totalDuration > 0 ? Math.min(1, t / m.totalDuration) : 0)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const play = useCallback((): void => {
    const howl = howlRef.current
    if (!howl) return
    if (status === 'ended') howl.seek(0)
    howl.play()
    setStatus('playing')
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [status, tick])

  const pause = useCallback((): void => {
    howlRef.current?.pause()
    stopRaf()
    setStatus('paused')
  }, [])

  const toggle = useCallback((): void => {
    if (status === 'playing') pause()
    else play()
  }, [status, play, pause])

  const replay = useCallback((): void => {
    const howl = howlRef.current
    if (!howl) return
    howl.seek(0)
    setActiveIndex(-1)
    setProgress(0)
    howl.play()
    setStatus('playing')
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const toggleMute = useCallback((): void => {
    setMuted((prev) => {
      const next = !prev
      howlRef.current?.mute(next)
      return next
    })
  }, [])

  useEffect(() => () => stopRaf(), [])

  const activeLine = activeIndex >= 0 && manifest ? manifest.lines[activeIndex] : null

  return {
    status,
    manifest,
    activeLineId: activeLine?.id ?? null,
    activeSpeaker: activeLine?.speaker ?? null,
    progress,
    muted,
    play,
    pause,
    toggle,
    replay,
    toggleMute,
  }
}
