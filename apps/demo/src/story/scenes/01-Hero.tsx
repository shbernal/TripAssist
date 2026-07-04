import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import { asset } from '../../lib/asset'
import { useReducedMotion } from '../../lib/useReducedMotion'

export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section
      id="hero"
      tabIndex={-1}
      aria-labelledby="hero-heading"
      className="relative flex h-dvh w-screen shrink-0 items-center overflow-y-auto px-6 pb-16 pt-8 outline-none sm:px-10"
    >
      <div className="m-auto grid w-full max-w-5xl items-center gap-6 md:grid-cols-2 md:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-1.5 text-sm text-slate-300">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-100">TripAssist</span>
          </span>
          <h1
            id="hero-heading"
            className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Voyager <span className="text-gradient-brand">sans obstacle</span>.
          </h1>
          <p className="mt-5 max-w-md text-pretty text-lg text-slate-400">
            Camille part pour Cannes en fauteuil roulant.{' '}
            <strong className="text-slate-200">TripAssist sécurise tout avant le départ.</strong>
          </p>
          <a
            href="#itinerary"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-bright px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform hover:scale-105"
          >
            Voir comment
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
            className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-deep/30 to-brand-bright/25 blur-2xl"
          />
          <img
            src={asset('faces/camille.png')}
            alt="Camille Moreau, 34 ans, souriante dans son fauteuil roulant électrique, un smartphone à la main."
            className="relative max-h-[34dvh] w-full max-w-xs rounded-[2rem] border border-slate-800 object-cover shadow-2xl sm:max-w-sm md:max-h-[60dvh]"
          />
        </motion.div>
      </div>

      {/* Movement hint: points the way the deck travels - down when stacked on
          mobile, sideways once the scenes sit side by side (md+). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 text-slate-500 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:-translate-x-0 md:-translate-y-1/2"
      >
        <ChevronDown className="h-6 w-6 animate-pulse md:hidden" />
        <ChevronRight className="hidden h-6 w-6 animate-pulse md:block" />
      </div>
    </section>
  )
}
