import { BookCheck } from 'lucide-react'
import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'
import { Chip } from '../../components/Chip'
import { CALLS } from '../calls'

export function Outro() {
  const entries = [CALLS['airport-call'].outcome, CALLS['hotel-call'].outcome]
  return (
    <Scene
      id="outro"
      step="05"
      eyebrow="Tout est tracé"
      heading="Chaque confirmation, scellée au registre."
    >
      <div className="grid items-center gap-10 md:grid-cols-2">
        <Reveal from="left">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
              <BookCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
              Registre de voyage - Camille Moreau
            </div>
            <ul className="space-y-3">
              {entries.map((e) => (
                <li
                  key={e.reference}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Chip tone="confirmed">réf. {e.reference}</Chip>
                  </div>
                  <p className="text-sm text-slate-300">{e.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal from="right">
          <h3 className="text-2xl font-semibold text-slate-100">
            L’accessibilité, <span className="text-gradient-brand">garantie et traçable</span>.
          </h3>
          <p className="mt-3 max-w-md text-slate-400">
            Le travail est fait en amont - le voyageur n’a plus à le porter.
          </p>
        </Reveal>
      </div>
    </Scene>
  )
}
