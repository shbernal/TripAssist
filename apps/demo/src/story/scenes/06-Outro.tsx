import { ArrowUpRight, BookCheck } from 'lucide-react'
import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'
import { Chip } from '../../components/Chip'
import { CALLS } from '../calls'

const REPO_URL = 'https://github.com/1cekubesv1/AccessTrip'

export function Outro() {
  const entries = [CALLS['airport-call'].outcome, CALLS['hotel-call'].outcome]
  return (
    <Scene
      id="outro"
      step="05"
      eyebrow="Tout est tracé"
      heading="Chaque confirmation, scellée au registre de voyage."
    >
      <div className="grid items-center gap-12 md:grid-cols-2">
        <Reveal from="left">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
              <BookCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
              Registre de voyage - Camille Moreau
            </div>
            <ul className="space-y-4">
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
          <p className="mt-4 max-w-md text-slate-400">
            AccessTrip transforme un voyage semé d’incertitudes en une suite de confirmations. Le
            travail est fait en amont - le voyageur n’a plus à le porter.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-teal to-brand-violet px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-105"
          >
            Découvrir le produit
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </Reveal>
      </div>
    </Scene>
  )
}
