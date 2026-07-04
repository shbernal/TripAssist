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
      eyebrow="Côté Camille"
      heading="Deux notifications. Rien à courir après."
    >
      <div className="grid items-center gap-10 md:grid-cols-2">
        <Reveal from="left">
          <p className="max-w-md text-lg text-slate-400">
            Aucun appel à passer, rien à expliquer. Son téléphone vibre&nbsp;: tout est{' '}
            <strong className="text-slate-200">déjà réglé</strong>.
          </p>
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
