import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'
import { CallStage } from '../../components/CallStage'

export function HotelCall() {
  return (
    <Scene
      id="hotel-call"
      step="03"
      eyebrow="Appel n°2 — l’hôtel"
      heading="À l’hôtel, la chambre 104 a une baignoire. L’agent ne lâche rien."
    >
      <p className="-mt-4 mb-8 max-w-2xl text-slate-400">
        La réception propose une baignoire à porte — inutilisable pour Camille. L’agent refuse le
        compromis et obtient la chambre 210, avec une vraie douche à l’italienne, sans supplément.
      </p>
      <Reveal>
        <CallStage callId="hotel-call" />
      </Reveal>
    </Scene>
  )
}
