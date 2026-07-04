import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { TopBar } from './components/TopBar'
import { Overview } from './components/Overview'
import { Proactive } from './components/Proactive'
import { Roster } from './components/Roster'
import { Registry } from './components/Registry'
import { Alerts } from './components/Alerts'
import { Roadmap } from './components/Roadmap'
import { OnboardingLayer, type TourStep } from './components/Onboarding'

// The guided onboarding tour — one step per solution aspect, each spotlighting
// its section on the live dashboard behind it.
const TOUR: TourStep[] = [
  {
    target: 'tour-overview',
    eyebrow: 'Aspect 1 / 6',
    title: 'Le groupe en un coup d’œil',
    body: 'Vingt voyageurs, tous leurs profils d’accessibilité remontés d’emblée. Vous savez immédiatement où en est le groupe.',
  },
  {
    target: 'tour-proactive',
    eyebrow: 'Aspect 2 / 6',
    title: 'Des confirmations proactives',
    body: 'L’agent a appelé l’aéroport (assistance WCHC) et l’hôtel (douche à l’italienne) avant le départ. Vous ne recevez que le résultat : des confirmations.',
  },
  {
    target: 'tour-roster',
    eyebrow: 'Aspect 3 / 6',
    title: 'Une garantie par voyageur',
    body: 'Vert, orange, rouge : chaque besoin est suivi jusqu’au bout. Rien n’est laissé à la charge du voyageur — ni à la vôtre.',
  },
  {
    target: 'tour-registry',
    eyebrow: 'Aspect 4 / 6',
    title: 'Un registre traçable',
    body: 'Chaque confirmation est journalisée : prestataire, référence, horodatage. L’accessibilité est prouvable, pas seulement promise.',
  },
  {
    target: 'tour-alerts',
    eyebrow: 'Aspect 5 / 6',
    title: 'Seules les exceptions remontent',
    body: 'Les rares voyageurs qui demandent une action de votre part sont isolés ici. Le reste est déjà réglé.',
  },
  {
    target: 'tour-roadmap',
    eyebrow: 'Aspect 6 / 6',
    title: 'Et demain : la replanification',
    body: 'En cas d’aléa (vol retardé, hôtel indisponible), l’agent replanifiera et re-confirmera tout seul. C’est la prochaine étape.',
  },
]

const STORY_URL = import.meta.env.DEV ? 'https://shbernal.github.io/TripAssist/' : '/TripAssist/'

export default function App() {
  // Tour starts open on first paint — it's the intended entry experience — but is
  // fully dismissible into free exploration.
  const [tourOpen, setTourOpen] = useState(true)
  const [step, setStep] = useState(0)

  const startTour = () => {
    setStep(0)
    setTourOpen(true)
  }

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only sr-only-focusable">
        Aller au contenu principal
      </a>

      <TopBar onStartTour={startTour} />

      <main id="main" className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <Overview />
        <Proactive />
        <Roster />
        <div className="grid gap-5 lg:grid-cols-2">
          <Registry />
          <Alerts />
        </div>
        <Roadmap />

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-500">
          <p>
            Démo statique — données fictives. TripAssist rend l’accessibilité
            <span className="text-slate-300"> garantie et traçable</span>.
          </p>
          <a
            href={STORY_URL}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
          >
            Voir l’histoire de Camille
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden={true} />
          </a>
        </footer>
      </main>

      <OnboardingLayer
        open={tourOpen}
        steps={TOUR}
        index={step}
        onIndex={setStep}
        onClose={() => setTourOpen(false)}
      />
    </div>
  )
}
