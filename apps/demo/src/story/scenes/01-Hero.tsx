import { motion } from 'framer-motion'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { asset } from '../../lib/asset'
import { useReducedMotion } from '../../lib/useReducedMotion'

export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section
      id="hero"
      tabIndex={-1}
      aria-labelledby="hero-heading"
      className="relative flex h-dvh w-screen shrink-0 snap-start items-center overflow-y-auto px-6 py-16 outline-none sm:px-10"
    >
      <div className="m-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-1.5 text-sm text-slate-300">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
            Accessibilité garantie, pas à courir après
          </span>
          <h1
            id="hero-heading"
            className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Voyager <span className="text-gradient-brand">sans obstacle</span>.
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg text-slate-400">
            Dès la réservation, un agent IA appelle l’aéroport et l’hôtel pour sécuriser
            l’accessibilité de Camille - <strong className="text-slate-200">avant le départ</strong>
            . Elle reçoit simplement les confirmations.
          </p>
          <a
            href="#itinerary"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-teal to-brand-violet px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform hover:scale-105"
          >
            Voir l’histoire de Camille
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>

        <motion.div
          className="relative mx-auto"
          initial={reduced ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-teal/25 to-brand-violet/25 blur-2xl"
          />
          <img
            src={asset('faces/camille.png')}
            alt="Camille Moreau, 34 ans, souriante dans son fauteuil roulant électrique, un smartphone à la main."
            className="relative w-full max-w-sm rounded-[2rem] border border-slate-800 object-cover shadow-2xl"
          />
        </motion.div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-slate-500"
      >
        <ChevronRight className="h-6 w-6 animate-pulse" />
      </div>
    </section>
  )
}
