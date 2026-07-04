import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'
import { CallStage } from '../../components/CallStage'

export function HotelCall() {
  return (
    <Scene
      id="hotel-call"
      step="03"
      eyebrow="Appel n°2 - l’hôtel"
      heading="La chambre a une baignoire. L’agent ne lâche rien."
    >
      <Reveal>
        <CallStage callId="hotel-call" />
      </Reveal>
    </Scene>
  )
}
