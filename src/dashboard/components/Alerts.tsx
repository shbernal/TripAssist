import { CheckCircle2 } from 'lucide-react'
import { Section } from './Section'
import { KIND_META, STATUS_META } from '../lib/status'
import { StatusBadge } from './StatusBadge'
import { alerts } from '../data/selectors'

export function Alerts() {
  return (
    <Section id="tour-alerts" eyebrow="Exceptions & alertes" title="Ce qui demande votre attention">
      {alerts.length === 0 ? (
        <p className="inline-flex items-center gap-2 text-sm text-ok">
          <CheckCircle2 className="h-4 w-4" aria-hidden={true} />
          Rien à signaler, tout le groupe est garanti.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-400">
            {alerts.length} voyageur{alerts.length > 1 ? 's' : ''} sur un total garanti : seules les
            exceptions remontent, le reste est déjà réglé.
          </p>
          <ul className="space-y-3">
            {alerts.map(({ traveler, status, issues }) => (
              <li
                key={traveler.id}
                className={`rounded-xl border ${STATUS_META[status].border} ${STATUS_META[status].bg} p-4`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-100">
                    {traveler.name}
                    <span className="ml-2 font-normal text-slate-400">{traveler.profile}</span>
                  </p>
                  <StatusBadge status={status} />
                </div>
                <ul className="mt-2 space-y-1.5">
                  {issues.map((c) => {
                    const K = KIND_META[c.kind]
                    return (
                      <li key={c.kind} className="text-xs">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                          <K.Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden={true} />
                          {c.label} · {c.detail}
                        </span>
                        {c.note && (
                          <p className={`mt-0.5 ${STATUS_META[c.status].text}`}>{c.note}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  )
}
