// Auth + multi-tenant portfolio routes, mounted under /api.
// Additive: these add login on top of the open demo - they never gate existing routes.
// `req.operatorId` is populated by the resolveOperator middleware (server/index.ts) and
// always set (demo when anonymous), so /trips works with or without a session.
import express from 'express'
import {
  verifyPassword,
  signSession,
  getOperator,
  publicOperator,
  DEFAULT_OPERATOR_ID,
  SESSION_COOKIE,
} from '../auth.js'
import { listTrips } from '../store.js'

const router = express.Router()

// A week-long session cookie. HttpOnly (no JS access) + SameSite=Lax; not marked
// Secure so it works over http://localhost in dev (a prod deploy behind TLS should add it).
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // seconds

function setSessionCookie(res: express.Response, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`,
  )
}

function clearSessionCookie(res: express.Response): void {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`)
}

// POST /api/login { email, password } → signed session cookie + operator.
router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'email + mot de passe requis' })
  }
  const op = verifyPassword(email, password)
  if (!op) return res.status(401).json({ ok: false, error: 'Identifiants invalides' })
  setSessionCookie(res, signSession(op.id))
  res.json({ ok: true, operator: publicOperator(op) })
})

// POST /api/logout → drop the cookie (falls back to the demo tenant afterwards).
router.post('/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

// GET /api/me → the resolved operator (demo when anonymous), plus whether it's a real login.
router.get('/me', (req, res) => {
  const id = req.operatorId || DEFAULT_OPERATOR_ID
  const op = getOperator(id)
  if (!op) return res.status(500).json({ ok: false, error: 'opérateur introuvable' })
  res.json({
    ok: true,
    operator: publicOperator(op),
    authenticated: id !== DEFAULT_OPERATOR_ID,
  })
})

// GET /api/trips → this operator's portfolio (demo sees the camille seed trip).
router.get('/trips', (req, res) => {
  const owner = req.operatorId || DEFAULT_OPERATOR_ID
  res.json({ ok: true, owner, trips: listTrips(owner) })
})

export default router
