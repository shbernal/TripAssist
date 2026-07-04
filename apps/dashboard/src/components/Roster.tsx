import { ChevronRight } from 'lucide-react'
import { Section } from './Section'
import { CATEGORY_ICON, KIND_META, STATUS_META } from '../lib/status'
import { StatusBadge } from './StatusBadge'
import { travelers } from '../data/trip'
import { travelerStatus } from '../data/selectors'
import type { Traveler } from '../data/types'

export function Roster() {
  return (
    <Section
      id="tour-roster"
      eyebrow="Suivi des garanties"
      title="Chaque voyageur, chaque besoin"
      action={<Legend />}
    >
      <ul className="grid gap-3 lg:grid-cols-2">
        {travelers.map((t) => (
          <TravelerCard key={t.id} traveler={t} />
        ))}
      </ul>
    </Section>
  )
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-3 text-xs text-slate-400">
      {(['confirmed', 'pending', 'attention'] as const).map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} aria-hidden={true} />
          {STATUS_META[s].label}
        </li>
      ))}
    </ul>
  )
}

function TravelerCard({ traveler: t }: { traveler: Traveler }) {
  const status = travelerStatus(t)
  const CatIcon = CATEGORY_ICON[t.category]
  return (
    <li className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-brand-bright">
            <CatIcon className="h-4 w-4" aria-hidden={true} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {t.name} <span className="font-normal text-slate-500">· {t.age} ans</span>
            </p>
            <p className="text-xs text-slate-400">{t.profile}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Compact per-leg status: airport / hotel / transfer dots. */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {t.confirmations.map((c) => {
          const K = KIND_META[c.kind]
          const m = STATUS_META[c.status]
          return (
            <li
              key={c.kind}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${m.border} ${m.bg}`}
            >
              <K.Icon className="h-3.5 w-3.5 text-slate-300" aria-hidden={true} />
              <span className="text-slate-300">{K.label}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden={true} />
              <span className="sr-only">{m.label}</span>
            </li>
          )
        })}
      </ul>

      <details className="group mt-3">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-brand-bright hover:text-brand-blue">
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
            aria-hidden={true}
          />
          Voir les garanties ({t.confirmations.length})
        </summary>
        <ul className="mt-2 space-y-2 border-t border-slate-800 pt-2">
          {t.confirmations.map((c) => {
            const K = KIND_META[c.kind]
            return (
              <li key={c.kind} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                    <K.Icon className="h-3.5 w-3.5 text-brand-bright" aria-hidden={true} />
                    {c.label}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-0.5 text-slate-400">{c.detail}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {c.provider} · réf. {c.reference} · {c.at}
                </p>
                {c.note && <p className={`mt-1 ${STATUS_META[c.status].text}`}>{c.note}</p>}
              </li>
            )
          })}
        </ul>
      </details>
    </li>
  )
}
