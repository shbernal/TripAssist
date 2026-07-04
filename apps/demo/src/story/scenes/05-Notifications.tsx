import { Scene } from '../../components/Scene'
import { Reveal } from '../../components/Reveal'
import { Phone } from '../../components/Phone'
import { Notification } from '../../components/Notification'
import { CALLS } from '../calls'

export function Notifications() {
  const airport = CALLS['airport-call'].outcome
  const hotel = CALLS['hotel-call'].outcome
  return (
    <Scene
      id="notifications"
      step="04"
      eyebrow="Camille reçoit deux confirmations"
      heading="Deux notifications. Rien à courir après."
    >
      <div className="grid items-center gap-12 md:grid-cols-2">
        <Reveal from="left">
          <p className="max-w-md text-lg text-slate-400">
            Camille n’a passé aucun appel, envoyé aucun e-mail, expliqué son handicap à personne.
            Son téléphone vibre&nbsp;: tout est{' '}
            <strong className="text-slate-200">déjà réglé</strong>.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-400">
            <li>✅ Assistance aéroport confirmée — réf. {airport.reference}</li>
            <li>✅ Douche à l’italienne confirmée — réf. {hotel.reference}</li>
          </ul>
        </Reveal>

        <Reveal from="right">
          <Phone>
            <Notification
              kind={airport.kind}
              title={airport.notification.title}
              body={airport.notification.body}
            />
            <Notification
              kind={hotel.kind}
              title={hotel.notification.title}
              body={hotel.notification.body}
              delay={0.5}
            />
          </Phone>
        </Reveal>
      </div>
    </Scene>
  )
}
