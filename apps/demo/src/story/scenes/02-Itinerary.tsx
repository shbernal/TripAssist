import { motion } from 'framer-motion'
import { Building2, Plane, Train, Accessibility } from 'lucide-react'
import { asset } from '../../lib/asset'
import { useReducedMotion } from '../../lib/useReducedMotion'
import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'

const STEPS = [
  { icon: Plane, label: 'Vol AF 7612 · Paris-CDG → Nice', sub: '12 sept. · 10h05' },
  { icon: Building2, label: 'Hôtel Beau Rivage · Nice', sub: '12–15 sept. · ch. 104' },
  { icon: Train, label: 'Transferts porte-à-porte', sub: 'Dépose-minute + navette' },
]

const NEEDS = ['Assistance embarquement (WCHC)', 'Douche à l’italienne', 'Accès sans marche']

export function Itinerary() {
  const reduced = useReducedMotion()
  return (
    <Scene
      id="itinerary"
      step="01"
      eyebrow="L’agent reçoit l’itinéraire"
      heading="Un itinéraire arrive. L’agent se met au travail."
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
              alt="Avatar de l’agent IA AccessTrip, un orbe lumineux teal et violet."
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
    </Scene>
  )
}
