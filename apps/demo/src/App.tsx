import { PhoneCall, ShieldCheck } from 'lucide-react'

// Phase 1 placeholder. The scroll-driven six-scene story (Hero → Itinerary →
// Airport call → Hotel call → Notifications → Outro) lands in Phase 3.
export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-slate-100">
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm text-slate-300">
        <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
        Accessibilité garantie, pas à courir après
      </span>
      <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
        AccessTrip — voyager sans obstacle
      </h1>
      <p className="max-w-xl text-pretty text-lg text-slate-400">
        Dès la réservation, un agent IA appelle l&apos;aéroport et l&apos;hôtel pour sécuriser
        l&apos;accessibilité de Camille — avant le départ. Elle reçoit simplement les confirmations.
      </p>
      <p className="inline-flex items-center gap-2 text-sm text-slate-500">
        <PhoneCall aria-hidden="true" className="h-4 w-4" />
        Démo narrative à venir (Phase&nbsp;3)
      </p>
    </main>
  )
}
