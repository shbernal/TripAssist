import { BadgeCheck, BedDouble, FileText, Plane, type LucideIcon } from 'lucide-react'
import { Section } from './Section'

interface Step {
  Icon: LucideIcon
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    Icon: FileText,
    title: 'L’agent lit l’itinéraire',
    body: 'Dès la réservation du groupe, chaque profil d’accessibilité est extrait, voyageur par voyageur.',
  },
  {
    Icon: Plane,
    title: 'Il appelle l’aéroport',
    body: 'Assistance WCHC/WCHR, oxygène, chien guide… négociés et confirmés auprès des services PMR.',
  },
  {
    Icon: BedDouble,
    title: 'Il appelle l’hôtel',
    body: 'Douche à l’italienne, chambre PMR, kit sourds : chaque besoin est réservé avant le départ.',
  },
]

export function Proactive() {
  return (
    <Section
      id="tour-proactive"
      eyebrow="Confirmations proactives"
      title="Tout est sécurisé avant le départ"
    >
      <p className="mb-5 max-w-2xl text-sm text-slate-400">
        Vous ne courez plus après les prestataires. L’agent TripAssist appelle l’aéroport et l’hôtel{' '}
        <strong className="text-slate-200">de lui-même</strong>, obtient des confirmations
        structurées, et vous les livre — prêtes.
      </p>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-4"
          >
            <span className="absolute top-4 right-4 text-xs font-semibold text-slate-600">
              {i + 1}
            </span>
            <s.Icon className="h-6 w-6 text-brand-bright" aria-hidden={true} />
            <h3 className="mt-3 text-sm font-semibold text-slate-100">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/10 px-3 py-2 text-sm text-ok">
        <BadgeCheck className="h-4 w-4" aria-hidden={true} />
        Résultat : vous recevez des confirmations, pas des tâches.
      </p>
    </Section>
  )
}
