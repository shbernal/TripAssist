import { ShieldCheck } from 'lucide-react'
import { Section } from './Section'
import { KIND_META, STATUS_META } from '../lib/status'
import { registry } from '../data/selectors'

// Show the newest slice of the registry; the full log is long; the point is that
// every guarantee is timestamped, referenced, and attributed to a provider.
const RECENT = registry.slice(0, 12)

export function Registry() {
  return (
    <Section
      id="tour-registry"
      eyebrow="Registre traçable"
      title="Chaque garantie, journalisée"
      action={
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-brand-bright" aria-hidden={true} />
          {registry.length} entrées
        </span>
      }
    >
      <p className="mb-3 text-sm text-slate-400">
        Prestataire, référence, horodatage : de quoi prouver, à tout moment, que l’accessibilité est
        garantie, pas seulement promise.
      </p>
      <ul className="space-y-1.5">
        {RECENT.map((e) => {
          const K = KIND_META[e.kind]
          const m = STATUS_META[e.status]
          return (
            <li
              key={e.reference}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${m.dot}`} aria-hidden={true} />
              <K.Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden={true} />
              <span className="min-w-0 flex-1 truncate text-slate-200">
                <span className="font-medium">{e.travelerName}</span>
                <span className="text-slate-500"> · {e.detail}</span>
              </span>
              {/* Reference + timestamp: own line on phones (aligned under the text),
                  back inline at sm. */}
              <span className="flex w-full shrink-0 items-center gap-3 pl-[46px] sm:w-auto sm:pl-0">
                <span className="font-mono text-[10px] text-slate-500">{e.reference}</span>
                <span className="text-slate-500">{e.at}</span>
              </span>
              <span className="sr-only">{m.label}</span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
