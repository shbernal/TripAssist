import { Route } from 'lucide-react'
import { Section } from './Section'

export function Roadmap() {
  return (
    <Section
      id="tour-roadmap"
      eyebrow="Feuille de route"
      title="Bientôt : replanification en cas d’aléa"
    >
      <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-5 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-brand-bright">
          <Route className="h-5 w-5" aria-hidden={true} />
        </span>
        <div>
          <p className="text-sm text-slate-300">
            Vol retardé, correspondance manquée, hôtel indisponible ? L’agent détectera l’aléa,
            <strong className="text-slate-100"> replanifiera</strong> et
            <strong className="text-slate-100"> re-confirmera</strong> chaque garantie touchée —
            automatiquement, sans que vous ayez à reprendre les prestataires un à un.
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs">
            <span className="rounded-full border border-brand-bright/30 bg-brand-blue/10 px-2 py-0.5 font-medium text-brand-bright">
              À venir
            </span>
            <span className="text-slate-500">
              Direction produit — hors périmètre de la démo actuelle.
            </span>
          </p>
        </div>
      </div>
    </Section>
  )
}
