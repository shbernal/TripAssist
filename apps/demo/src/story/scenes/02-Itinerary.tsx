import { motion } from 'framer-motion'
import { Building2, Plane, MapPin, Undo2, Accessibility } from 'lucide-react'
import { asset } from '../../lib/asset'
import { useReducedMotion } from '../../lib/useReducedMotion'
import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'

const STEPS = [
  { icon: MapPin, label: 'Paris', sub: 'Départ' },
  { icon: Plane, label: 'Paris-CDG → Cannes-Mandelieu', sub: 'Vol AF 7612 · 12 sept. 10h05' },
  { icon: Building2, label: 'Cannes · Hôtel le Mistral', sub: '12–15 sept. · chambre 104' },
  { icon: Undo2, label: 'Retour', sub: 'Cannes-Mandelieu → Paris · 15 sept.' },
]

const NEEDS = [
  {
    img: 'scenes/wchc-boarding.png',
    label: 'Assistance WCHC',
    alt: 'Un agent d’assistance aéroportuaire accompagne une voyageuse en fauteuil roulant à l’entrée de la passerelle d’embarquement.',
  },
  {
    img: 'scenes/roll-in-shower.png',
    label: 'Douche à l’italienne',
    alt: 'Salle de bain accessible avec une douche à l’italienne de plain-pied, barres d’appui et siège de douche rabattable.',
  },
]

export function Itinerary() {
  const reduced = useReducedMotion()
  return (
    <Scene
      id="itinerary"
      step="01"
      eyebrow="L’itinéraire est reçu"
      heading="L’agent lit le voyage. Deux appels à passer."
    >
      <div className="grid items-center gap-6 md:grid-cols-2 md:gap-8">
        {/* The booking, as received */}
        <Reveal from="left">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Réservation · Camille Moreau
            </p>
            <ul className="space-y-3">
              {STEPS.map((s) => (
                <li key={s.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-brand-bright">
                    <s.icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-100">{s.label}</span>
                    <span className="block text-xs text-slate-500">{s.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* The agent wakes and pins the two needs to secure */}
        <Reveal from="right" delay={0.15}>
          <div className="flex flex-col items-center text-center">
            <motion.img
              src={asset('faces/ai-agent.png')}
              alt="Avatar de l’agent IA TripAssist, un orbe lumineux bleu."
              className="h-20 w-20"
              animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="mt-3 max-w-sm text-slate-400">
              Deux besoins détectés. L’agent décroche le téléphone.
            </p>
            <div className="mt-5 flex items-start justify-center gap-6 sm:gap-10">
              {NEEDS.map((o, i) => (
                <motion.figure
                  key={o.img}
                  className="flex w-32 flex-col items-center text-center sm:w-36"
                  animate={reduced ? undefined : { y: [0, -6, 0] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.4,
                  }}
                >
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -inset-2 rounded-full bg-gradient-to-br from-brand-deep/40 to-brand-bright/30 blur-xl"
                    />
                    <img
                      src={asset(o.img)}
                      alt={o.alt}
                      className="relative h-24 w-24 rounded-full object-cover shadow-xl ring-2 ring-brand-blue/50 sm:h-28 sm:w-28"
                    />
                  </div>
                  <figcaption className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 sm:text-sm">
                    <Accessibility aria-hidden="true" className="h-4 w-4 text-brand-bright" />
                    {o.label}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Scene>
  )
}
