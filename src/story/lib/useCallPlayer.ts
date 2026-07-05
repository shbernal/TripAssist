import { useCallback, useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { asset } from './asset'
import type { CallId, Speaker } from '../story/calls'

export interface ManifestLine {
  id: number
  speaker: Speaker
  caption: string
  /** Full spoken sentence. Absent from manifests generated before it existed -
      callers fall back to the transcript mirror in story/calls.ts. */
  text?: string
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
  /** True while the pause came from the user (via `toggle`), not from the deck
      pausing an off-screen scene - callers must not auto-resume over it. */
  userPaused: boolean
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
  const [userPaused, setUserPaused] = useState(false)

  const howlRef = useRef<Howl | null>(null)
  const rafRef = useRef<number | null>(null)
  const manifestRef = useRef<CallManifest | null>(null)
  const mutedRef = useRef(false)

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
        // Autoplay was blocked (no user gesture yet). Fall back to 'ready' so
        // the visible controls take over - reporting 'paused' here would make
        // CallStage retry play() in a loop the browser keeps refusing.
        setStatus('ready')
      },
    })
    howlRef.current = howl

    // Mobile browsers block gesture-free autoplay until the page's audio has been
    // unlocked by a user interaction. Scenes autoplay from an effect (not inside
    // the gesture), and the first call is usually reached via autopilot with no
    // prior tap - so it would stay silent while later calls (reached only after
    // the user swipes) play. Bless this call's audio element on the first user
    // gesture anywhere: a muted play()/stop() within the gesture grants the
    // element its user-initiated flag, so a later gesture-free autoplay is allowed.
    const events = ['pointerdown', 'touchend', 'keydown'] as const
    const prime = (): void => {
      events.forEach((type) => document.removeEventListener(type, prime, true))
      const h = howlRef.current
      if (!h || h.playing()) return
      const wasMuted = mutedRef.current
      h.mute(true)
      const id = h.play()
      h.stop(id)
      h.mute(wasMuted)
    }
    events.forEach((type) => document.addEventListener(type, prime, true))

    return () => {
      stopRaf()
      events.forEach((type) => document.removeEventListener(type, prime, true))
      howl.unload()
      howlRef.current = null
    }
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
    setUserPaused(false)
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

  // `toggle` is only ever wired to the visible controls, so a pause through it
  // is *user intent* - remembered so scene logic doesn't auto-resume over it.
  const toggle = useCallback((): void => {
    if (status === 'playing') {
      setUserPaused(true)
      pause()
    } else {
      play()
    }
  }, [status, play, pause])

  const replay = useCallback((): void => {
    const howl = howlRef.current
    if (!howl) return
    howl.seek(0)
    setActiveIndex(-1)
    setProgress(0)
    setUserPaused(false)
    howl.play()
    setStatus('playing')
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const toggleMute = useCallback((): void => {
    setMuted((prev) => {
      const next = !prev
      mutedRef.current = next
      howlRef.current?.mute(next)
      return next
    })
  }, [])

  useEffect(() => () => stopRaf(), [])

  // Dev-only escape hatch so browser automation (Playwright) can drive the
  // call without waiting out the full audio. Absent from production builds.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as Window & {
      __callPlayers?: Record<string, { seek: (t: number) => void; play: () => void }>
    }
    w.__callPlayers = w.__callPlayers ?? {}
    w.__callPlayers[callId] = {
      seek: (t: number) => {
        howlRef.current?.seek(t)
      },
      play,
    }
    return () => {
      delete w.__callPlayers?.[callId]
    }
  }, [callId, play])

  const activeLine = activeIndex >= 0 && manifest ? manifest.lines[activeIndex] : null

  return {
    status,
    manifest,
    activeLineId: activeLine?.id ?? null,
    activeSpeaker: activeLine?.speaker ?? null,
    progress,
    muted,
    userPaused,
    play,
    pause,
    toggle,
    replay,
    toggleMute,
  }
}
