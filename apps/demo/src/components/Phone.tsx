import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'

interface PhoneProps {
  /** Lockscreen banners (Notification components). */
  children: ReactNode
  /** Big lockscreen clock. */
  time?: string
  date?: string
}

/**
 * A tilted, floating phone mock whose lockscreen hosts the confirmation banners.
 * Decorative chrome (frame, clock) is aria-hidden; the notifications inside carry
 * the real, readable content.
 */
export function Phone({ children, time = '9:41', date = 'jeudi 4 septembre' }: PhoneProps) {
  return (
    <div className="relative mx-auto w-full max-w-[18rem]">
      <div className="relative rounded-[2.75rem] border-[10px] border-slate-800 bg-slate-950 p-3 shadow-2xl">
        {/* notch */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-3 h-6 w-28 -translate-x-1/2 rounded-full bg-slate-800"
        />
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950">
          {/* wallpaper glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(20rem 20rem at 50% 0%, rgba(125,211,252,0.25), transparent 60%), radial-gradient(18rem 18rem at 80% 40%, rgba(29,78,216,0.35), transparent 60%)',
            }}
          />
          <div className="relative min-h-[min(24rem,55dvh)] px-4 pb-4 pt-6">
            {/* Decorative clock - dropped on very short viewports so the banners
                (the real content) never push the scene into vertical scroll. */}
            <div
              aria-hidden="true"
              className="mb-4 text-center text-white [@media(max-height:680px)]:hidden"
            >
              <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm text-white/70">{date}</p>
              <p className="text-4xl font-light tracking-tight sm:text-5xl">{time}</p>
            </div>
            <div className="space-y-3">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
