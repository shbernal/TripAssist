import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AppState, StepStatus } from '../../../shared/types'

// A traveler card as rendered by the fleet grid — Camille (live) and the seeded
// fleet both structurally satisfy this shape.
interface FleetDisplay {
  id: string
  name: string
  category: string
  profileShort: string
  client: string
  tripType: string
  route: string
  dates: string
  steps: StepStatus[]
  confirmations: number
  live?: boolean
}

// Fleet dashboard (Sprint 3 + scale): the operator view of a traveler portfolio.
// Camille is the live/interactive case; the others illustrate that the same
// orchestration scales across many travelers, clients (insurers / agencies) and
// disability profiles — the B2B pitch.
export default function FleetView({ state }: { state: AppState }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')

  // Camille's card, live from state
  const camille: FleetDisplay = {
    id: 'camille',
    name: state.traveler.name,
    category: 'Moteur',
    profileShort: 'Fauteuil électrique · douche italienne',
    client: 'AXA Assistance',
    tripType: 'Loisir',
    route: 'Paris → Nice',
    dates: '12–15 septembre',
    steps: state.trip.steps.map((s) => s.status),
    confirmations: state.ledger.length,
    live: true,
  }
  const all = [camille, ...(state.fleet || [])]
  const clients = ['all', ...Array.from(new Set(all.map((t) => t.client)))]

  const travelers = useMemo(
    () =>
      all.filter((t) => {
        if (statusFilter !== 'all' && overall(t.steps).cls !== statusFilter) return false
        if (clientFilter !== 'all' && t.client !== clientFilter) return false
        if (q) {
          const hay =
            `${t.name} ${t.route} ${t.profileShort} ${t.client} ${t.tripType}`.toLowerCase()
          if (!hay.includes(q.toLowerCase())) return false
        }
        return true
      }),
    [all, statusFilter, clientFilter, q],
  )

  // operator-level aggregate KPIs (over the full portfolio, not the filtered view)
  const totalSteps = all.reduce((n, t) => n + t.steps.length, 0)
  const failed = all.reduce((n, t) => n + t.steps.filter((s) => s === 'failed').length, 0)
  const atRisk = all.reduce((n, t) => n + t.steps.filter((s) => s === 'at_risk').length, 0)
  const completed = all.filter((t) => t.steps.every((s) => s === 'done')).length
  const distinctClients = new Set(all.map((t) => t.client)).size
  const sla = totalSteps ? Math.round(((totalSteps - failed) / totalSteps) * 100) : 100

  const kpis = [
    { label: 'Voyageurs suivis', value: all.length, icon: '👥' },
    { label: 'Clients (assureurs/agences)', value: distinctClients, icon: '🏢' },
    { label: 'Voyages en cours', value: all.length - completed, icon: '🧭' },
    { label: 'Incidents actifs', value: atRisk + failed, icon: '⚠️' },
    { label: 'SLA accessibilité', value: `${sla}%`, icon: '♿' },
  ]

  return (
    <div className="page">
      <div className="fleet-head">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Portefeuille voyageurs</h1>
          <p className="muted" style={{ margin: '0.2rem 0 0' }}>
            Vue opérateur — pensée pour les assureurs et agences de voyage.
            <span className="scale-note">
              {' '}
              Échantillon de {all.length} voyageurs ; la plateforme orchestre des milliers de
              trajets en parallèle.
            </span>
          </p>
        </div>
      </div>

      <section className="kpi-band" aria-label="Vue d'ensemble du portefeuille">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <span className="kpi-icon" aria-hidden="true">
              {k.icon}
            </span>
            <span className="kpi-value">{k.value}</span>
            <span className="kpi-label">{k.label}</span>
          </div>
        ))}
      </section>

      <div className="fleet-filters" role="search">
        <input
          type="text"
          className="fleet-search"
          placeholder="Rechercher un voyageur, une ligne, un profil…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher un voyageur"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les statuts</option>
          <option value="reconfirmed">Sécurisé</option>
          <option value="at_risk">À risque</option>
          <option value="failed">Incident</option>
          <option value="done">Terminé</option>
        </select>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          aria-label="Filtrer par client"
        >
          {clients.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'Tous les clients' : c}
            </option>
          ))}
        </select>
        <span className="fleet-count muted">
          {travelers.length} / {all.length}
        </span>
      </div>

      <div className="fleet-grid">
        {travelers.map((t) => (
          <FleetCard key={t.id} traveler={t} onOpen={() => navigate(`/traveler/${t.id}`)} />
        ))}
        {travelers.length === 0 && (
          <p className="muted">Aucun voyageur ne correspond à ces critères.</p>
        )}
      </div>
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  identified: 'var(--st-identified)',
  contacted: 'var(--st-contacted)',
  confirmed: 'var(--st-confirmed)',
  reconfirmed: 'var(--st-reconfirmed)',
  in_progress: 'var(--st-inprogress)',
  done: 'var(--st-done)',
  at_risk: 'var(--st-atrisk)',
  failed: 'var(--st-failed)',
}

function overall(steps: StepStatus[]): { label: string; cls: string } {
  if (steps.some((s) => s === 'failed')) return { label: 'Incident', cls: 'failed' }
  if (steps.some((s) => s === 'at_risk')) return { label: 'À risque', cls: 'at_risk' }
  if (steps.every((s) => s === 'done')) return { label: 'Terminé', cls: 'done' }
  if (steps.some((s) => s === 'in_progress')) return { label: 'En cours', cls: 'in_progress' }
  return { label: 'Sécurisé', cls: 'reconfirmed' }
}

function FleetCard({ traveler, onOpen }: { traveler: FleetDisplay; onOpen: () => void }) {
  const o = overall(traveler.steps)
  return (
    <button
      type="button"
      className="fleet-card"
      onClick={onOpen}
      aria-label={`Ouvrir le voyage de ${traveler.name}`}
    >
      <div className="fleet-card-head">
        <span className="fleet-name">
          {traveler.name}
          {traveler.live && (
            <span className="live-dot" title="En direct" aria-label="en direct">
              {' '}
              ●
            </span>
          )}
        </span>
        <span className="badge" data-status={o.cls}>
          {o.label}
        </span>
      </div>
      <div className="fleet-profile">{traveler.profileShort}</div>
      <div className="fleet-route">
        {traveler.route} · <span className="muted">{traveler.dates}</span>
      </div>
      <div className="fleet-bar" aria-hidden="true">
        {traveler.steps.map((s, i) => (
          <span
            key={i}
            className="fleet-seg"
            style={{ background: STATUS_COLOR[s] || 'var(--line)' }}
          />
        ))}
      </div>
      <div className="fleet-tags">
        {traveler.category && <span className="fleet-tag">{traveler.category}</span>}
        {traveler.tripType && <span className="fleet-tag">{traveler.tripType}</span>}
        {traveler.client && <span className="fleet-tag client">{traveler.client}</span>}
      </div>
    </button>
  )
}
