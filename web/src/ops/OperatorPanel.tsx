import React, { useCallback, useEffect, useState } from 'react'
import { LogIn, LogOut, Building2, FileInput, Loader2 } from 'lucide-react'

// Multi-tenant + ingestion exerciser (§5.5 / §5.3). Shows the resolved operator,
// a login form when anonymous, the operator's trip portfolio, and a textarea that
// POSTs a pasted itinerary to /api/ingest. Additive: anonymous = the demo tenant, so
// this never blocks the public demo.

interface OperatorPublic {
  id: string
  email: string
  name: string
}
interface TripSummary {
  id: string
  label: string
  owner: string
  updated_at: string
}

export default function OperatorPanel() {
  const [operator, setOperator] = useState<OperatorPublic | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [trips, setTrips] = useState<TripSummary[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [itinerary, setItinerary] = useState('')
  const [busy, setBusy] = useState(false)
  const [ingestMsg, setIngestMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [me, tr] = await Promise.all([
      fetch('/api/me').then((r) => r.json()),
      fetch('/api/trips').then((r) => r.json()),
    ])
    if (me.ok) {
      setOperator(me.operator)
      setAuthenticated(me.authenticated)
    }
    if (tr.ok) setTrips(tr.trips)
  }, [])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const d = await r.json()
    if (!d.ok) {
      setAuthError(d.error || 'Échec de connexion')
      return
    }
    setPassword('')
    await refresh()
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    await refresh()
  }

  async function ingest() {
    if (!itinerary.trim()) return
    setBusy(true)
    setIngestMsg(null)
    try {
      const r = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itinerary }),
      })
      const d = await r.json()
      if (d.ok) {
        setIngestMsg(
          `Importé : « ${d.label} » — ${d.stepCount} étape(s) · analyse ${
            d.source === 'claude' ? 'Claude' : 'hors ligne'
          }`,
        )
        setItinerary('')
        await refresh()
      } else {
        setIngestMsg(d.error || "Échec de l'import")
      }
    } catch (err) {
      setIngestMsg((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="op-panel" aria-label="Opérateur et import d'itinéraire">
      <div className="op-head">
        <Building2 size={16} aria-hidden="true" />
        <strong>{operator ? operator.name : '—'}</strong>
        <span className="rc-badge live">{authenticated ? 'connecté' : 'démo (anonyme)'}</span>
        {authenticated && (
          <button type="button" className="btn-mini" onClick={logout}>
            <LogOut size={13} aria-hidden="true" /> Déconnexion
          </button>
        )}
      </div>

      {!authenticated && (
        <form className="op-login" onSubmit={login}>
          <label className="sr-only" htmlFor="op-email">
            E-mail opérateur
          </label>
          <input
            id="op-email"
            type="email"
            placeholder="ops@…"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="sr-only" htmlFor="op-pw">
            Mot de passe
          </label>
          <input
            id="op-pw"
            type="password"
            placeholder="mot de passe"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-mini">
            <LogIn size={13} aria-hidden="true" /> Connexion
          </button>
          {authError && (
            <span role="alert" className="op-error">
              {authError}
            </span>
          )}
        </form>
      )}

      <div className="op-portfolio">
        <span className="muted">Portefeuille ({trips.length}) :</span>{' '}
        {trips.length ? (
          <ul className="op-trip-list">
            {trips.map((t) => (
              <li key={t.id}>
                {t.label} <span className="muted">· {t.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="muted">aucun voyage</span>
        )}
      </div>

      <div className="op-ingest">
        <label htmlFor="op-itinerary" className="op-ingest-label">
          <FileInput size={14} aria-hidden="true" /> Importer un itinéraire (coller une réservation)
        </label>
        <textarea
          id="op-itinerary"
          rows={4}
          placeholder="Ex. TGV Paris → Nice 12/09 09:03, Hôtel Beau Rivage chambre accessible douche à l'italienne, voyageuse en fauteuil roulant…"
          value={itinerary}
          onChange={(e) => setItinerary(e.target.value)}
        />
        <button
          type="button"
          className="btn-mini"
          onClick={ingest}
          disabled={busy || !itinerary.trim()}
        >
          {busy ? (
            <Loader2 size={13} className="spin" aria-hidden="true" />
          ) : (
            <FileInput size={13} aria-hidden="true" />
          )}{' '}
          Analyser l'itinéraire
        </button>
        {ingestMsg && (
          <span role="status" aria-live="polite" className="op-ingest-msg">
            {ingestMsg}
          </span>
        )}
      </div>
    </section>
  )
}
