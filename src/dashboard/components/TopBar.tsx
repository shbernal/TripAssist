import { ArrowUpRight, MapPin, Plane } from 'lucide-react'
import { operator, trip } from '../data/trip'

// The landing-page (story) URL: the root entry of this same app, served at
// <base> in both dev and prod.
const STORY_URL = import.meta.env.BASE_URL

export function TopBar({ onStartTour }: { onStartTour: () => void }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              TripAssist <span className="text-xs font-normal text-brand-bright">Pro</span>
            </p>
            <p className="text-xs text-slate-400">
              {operator.name} · {operator.role}, {operator.agency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 sm:flex">
            <Plane className="h-3.5 w-3.5 text-brand-bright" aria-hidden={true} />
            <span className="font-medium text-slate-100">
              {trip.origin} → {trip.destination}
            </span>
            <span className="text-slate-500">·</span>
            <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden={true} />
            <span>{trip.departDate}</span>
          </div>
          <button
            type="button"
            onClick={onStartTour}
            className="rounded-lg border border-brand-bright/40 bg-brand-blue/10 px-3 py-1.5 text-sm font-medium text-brand-bright hover:bg-brand-blue/20"
          >
            Visite guidée
          </button>
          <a
            href={STORY_URL}
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
          >
            L’histoire
            <ArrowUpRight className="h-4 w-4" aria-hidden={true} />
          </a>
        </div>
      </div>
    </header>
  )
}
