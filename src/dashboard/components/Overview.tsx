import { CheckCircle2 } from 'lucide-react'
import { Section } from './Section'
import { CATEGORY_ICON, STATUS_META } from '../lib/status'
import { travelers, trip } from '../data/trip'
import { confirmationCounts, travelerCounts } from '../data/selectors'
import type { NeedCategory } from '../data/types'

const categoryCounts = travelers.reduce<Record<string, number>>((acc, t) => {
  acc[t.category] = (acc[t.category] ?? 0) + 1
  return acc
}, {})

const guaranteedPct = Math.round((travelerCounts.confirmed / travelerCounts.total) * 100)

export function Overview() {
  return (
    <Section
      id="tour-overview"
      eyebrow="Le groupe en un coup d’œil"
      title={`${travelerCounts.total} voyageurs · ${trip.origin} → ${trip.destination}`}
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Voyageurs garantis"
          value={`${travelerCounts.confirmed}/${travelerCounts.total}`}
          hint={`${guaranteedPct}% du groupe entièrement confirmé`}
          tone="ok"
        />
        <Stat
          label="Confirmations en cours"
          value={String(travelerCounts.pending)}
          hint="L’agent finalise avec le prestataire"
          tone="warn"
        />
        <Stat
          label="À traiter"
          value={String(travelerCounts.attention)}
          hint="Une action de votre part est requise"
          tone="alert"
        />
        <Stat
          label="Garanties enregistrées"
          value={String(confirmationCounts.total)}
          hint="Aéroport · hôtel · transfert, tracés"
          tone="brand"
        />
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-medium text-slate-400">Profils d’accessibilité</h3>
        <ul className="flex flex-wrap gap-2">
          {(Object.keys(categoryCounts) as NeedCategory[]).map((cat) => {
            const Icon = CATEGORY_ICON[cat]
            return (
              <li
                key={cat}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300"
              >
                <Icon className="h-3.5 w-3.5 text-brand-bright" aria-hidden={true} />
                {cat}
                <span className="font-semibold text-slate-100">{categoryCounts[cat]}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

const TONE: Record<string, string> = {
  ok: STATUS_META.confirmed.text,
  warn: STATUS_META.pending.text,
  alert: STATUS_META.attention.text,
  brand: 'text-brand-bright',
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: keyof typeof TONE
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 sm:p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${TONE[tone]}`}>{value}</p>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
        {tone === 'ok' && <CheckCircle2 className="h-3 w-3" aria-hidden={true} />}
        {hint}
      </p>
    </div>
  )
}
