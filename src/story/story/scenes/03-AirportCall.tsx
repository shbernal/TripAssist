import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'
import { CallStage } from '../../components/CallStage'

export function AirportCall({ active }: { active: boolean }) {
  return (
    <Scene
      id="airport-call"
      step="02"
      eyebrow="Appel n°1 - l’aéroport"
      heading="Assistance embarquement, réglée."
    >
      <Reveal>
        <CallStage callId="airport-call" active={active} />
      </Reveal>
    </Scene>
  )
}
