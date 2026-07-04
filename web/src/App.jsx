import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { useEvents } from './useEvents.js'
import FleetView from './fleet/FleetView.jsx'
import TravelerDetail from './traveler/TravelerDetail.jsx'
import OpsView from './ops/OpsView.jsx'
import DemoPanel from './demo/DemoPanel.jsx'
import GuidedDemo from './demo/GuidedDemo.jsx'
import { Wordmark } from './Logo.jsx'
import { APP_TAGLINE } from './config.js'

export default function App() {
  const events = useEvents()

  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu principal</a>
      <header className="app-header">
        <Wordmark />
        <span className="muted app-tagline" aria-hidden="true">{APP_TAGLINE}</span>
        <nav className="app-nav" aria-label="Vues">
          <NavLink to="/" end>Flotte</NavLink>
          <NavLink to="/traveler/camille">Voyageuse</NavLink>
          <NavLink to="/ops">Centre de contrôle</NavLink>
          <NavLink to="/demo">Démo</NavLink>
        </nav>
        <span className="conn-status muted" role="status" aria-live="polite">
          {events.connected ? '● en direct' : '○ hors ligne'}
        </span>
      </header>

      <main id="main">
        {!events.state ? (
          <p className="page">Chargement…</p>
        ) : (
          <Routes>
            <Route path="/" element={<FleetView state={events.state} />} />
            <Route path="/traveler/:id" element={<TravelerDetail state={events.state} />} />
            <Route path="/ops" element={<OpsView state={events.state} reload={events.reload} />} />
            <Route path="/demo" element={<DemoPanel state={events.state} reload={events.reload} />} />
          </Routes>
        )}
      </main>

      {/* Guided-demo narration overlay (Sprint 4), visible on any view when running */}
      <GuidedDemo reload={events.reload} />
    </>
  )
}
