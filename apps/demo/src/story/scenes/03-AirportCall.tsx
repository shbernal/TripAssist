import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'
import { CallStage } from '../../components/CallStage'

export function AirportCall() {
  return (
    <Scene
      id="airport-call"
      step="02"
      eyebrow="Appel n°1 - l’aéroport"
      heading="L’agent appelle Paris-CDG pour l’assistance embarquement."
    >
      <Reveal>
        <CallStage callId="airport-call" />
      </Reveal>
    </Scene>
  )
}
