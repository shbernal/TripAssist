import { ArrowUpRight } from 'lucide-react'
import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'

// The operator dashboard is the sibling app, published under /TripAssist/dashboard/.
// In local dev (demo on :5173, dashboard not served here) fall back to the live URL.
const DASHBOARD_URL = import.meta.env.DEV
  ? 'https://shbernal.github.io/TripAssist/dashboard/'
  : '/TripAssist/dashboard/'

// A slice of the traveler portfolio: varied disability profiles to show the same
// agent orchestrating every kind of need. The operator dashboard (apps/dashboard)
// expands this into a full ~20-traveler group.
const PROFILES = [
  {
    name: 'Marc Dubois',
    category: 'Auditif',
    profile: 'Malentendant · appareillé',
    route: 'Lyon → Bordeaux',
    need: 'annonces visuelles',
  },
  {
    name: 'Fatima Benali',
    category: 'Visuel',
    profile: 'Déficience visuelle · chien guide',
    route: 'Lille → Marseille',
    need: 'chien guide accepté',
  },
  {
    name: 'Léa Moreau',
    category: 'Cognitif',
    profile: 'Trouble du spectre autistique',
    route: 'Bordeaux → Paris',
    need: 'environnement calme',
  },
  {
    name: 'Élise Rousseau',
    category: 'Chronique',
    profile: 'Sclérose en plaques · fatigabilité',
    route: 'Nantes → Toulouse',
    need: 'temps de repos planifiés',
  },
  {
    name: 'Jean-Pierre Martin',
    category: 'Âge / Médical',
    profile: 'Mobilité réduite · oxygène',
    route: 'Marseille → Paris',
    need: 'oxygène médical à bord',
  },
  {
    name: 'Nathalie Petit',
    category: 'Temporaire',
    profile: 'Jambe plâtrée · béquilles',
    route: 'Nice → Paris',
    need: 'pas d’escaliers',
  },
]

export function UseCases() {
  return (
    <Scene
      id="use-cases"
      step="06"
      eyebrow="Pour chaque voyageur"
      heading="Camille n’est qu’un exemple."
    >
      <div className="grid items-center gap-8 md:grid-cols-[1fr_1.4fr] md:gap-10">
        <Reveal from="left">
          <p className="max-w-md text-lg text-slate-400">
            Auditif, visuel, cognitif, chronique… Sur le tableau de bord TripAssist, le même agent
            orchestre déjà <strong className="text-slate-200">tous les profils</strong> - les mêmes
            appels, les mêmes confirmations tracées, pour chaque voyageur.
          </p>
          <a
            href={DASHBOARD_URL}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-brand-bright/40 px-3 py-2 text-sm font-medium text-brand-bright hover:bg-brand-bright/10"
          >
            Voir le tableau de bord opérateur
            <ArrowUpRight className="h-4 w-4" aria-hidden={true} />
          </a>
        </Reveal>

        <Reveal from="right" delay={0.15}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PROFILES.map((p) => (
              <li key={p.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-100">{p.name}</span>
                  <span className="shrink-0 rounded-full border border-brand-bright/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand-bright">
                    {p.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{p.profile}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {p.route} · <span className="text-slate-300">{p.need}</span>
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Scene>
  )
}
