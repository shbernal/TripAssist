import { motion } from 'framer-motion'
import { Building2, Plane, MapPin, Undo2, Accessibility } from 'lucide-react'
import { asset } from '../../lib/asset'
import { useReducedMotion } from '../../lib/useReducedMotion'
import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'

const STEPS = [
  { icon: MapPin, label: 'Paris', sub: 'Départ · domicile de Camille' },
  {
    icon: Plane,
    label: 'Aéroport Paris-Charles-de-Gaulle',
    sub: 'Vol AF 7612 → Nice · 12 sept. 10h05',
  },
  { icon: Building2, label: 'Cannes · Hôtel le Mistral', sub: '12–15 sept. · chambre 104' },
  { icon: Undo2, label: 'Retour', sub: 'Nice → Paris-CDG · 15 sept.' },
]

const NEEDS = ['Assistance embarquement (WCHC)', 'Douche à l’italienne', 'Accès sans marche']

const NEED_ORBS = [
  {
    img: 'scenes/wchc-boarding.png',
    label: 'Assistance embarquement (WCHC)',
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
      heading="Prise en charge automatisée des aménagements de trajet."
    >
      <div className="grid items-center gap-10 md:grid-cols-2">
        {/* Itinerary card flying into the inbox */}
        <Reveal from="left">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Réservation · Camille Moreau
            </p>
            <ul className="space-y-4">
              {STEPS.map((s) => (
                <li key={s.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-brand-teal">
                    <s.icon aria-hidden="true" className="h-5 w-5" />
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

        {/* The agent wakes and parses needs into chips */}
        <Reveal from="right" delay={0.15}>
          <div className="flex flex-col items-center text-center">
            <motion.img
              src={asset('faces/ai-agent.png')}
              alt="Avatar de l’agent IA TripAssist, un orbe lumineux teal et violet."
              className="h-28 w-28"
              animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="mt-4 max-w-sm text-slate-400">
              L’agent lit l’itinéraire et en déduit les besoins d’accessibilité de Camille - puis
              décide qui appeler.
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {NEEDS.map((n, i) => (
                <motion.li
                  key={n}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ delay: 0.2 + i * 0.12 }}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-violet/40 bg-brand-violet/10 px-3 py-1 text-sm text-brand-violet"
                >
                  <Accessibility aria-hidden="true" className="h-4 w-4" />
                  {n}
                </motion.li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* The two provider needs the agent will secure, shown as glowing orbs */}
      <Reveal from="up" delay={0.1}>
        <div className="mt-12 flex flex-wrap items-start justify-center gap-10 sm:gap-16">
          {NEED_ORBS.map((o, i) => (
            <motion.figure
              key={o.img}
              className="flex w-44 flex-col items-center text-center"
              animate={reduced ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            >
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -inset-3 rounded-full bg-gradient-to-br from-brand-teal/30 to-brand-violet/30 blur-2xl"
                />
                <img
                  src={asset(o.img)}
                  alt={o.alt}
                  className="relative h-36 w-36 rounded-full object-cover shadow-xl ring-2 ring-brand-violet/50 sm:h-44 sm:w-44"
                />
              </div>
              <figcaption className="mt-4 text-sm font-medium text-slate-200">{o.label}</figcaption>
            </motion.figure>
          ))}
        </div>
      </Reveal>
    </Scene>
  )
}
