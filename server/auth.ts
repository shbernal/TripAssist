// Minimal auth + multi-tenant identity - dependency-free (node:crypto only).
// Additive by design: unauthenticated requests resolve to the `demo` operator (which
// owns the `camille` seed trip), so the existing demo + tests keep working. Logging in
// unlocks a real per-operator portfolio on top. This is hackathon-grade: operators are
// an in-code seed and passwords are hashed at module load - no operator CRUD, no DB
// user table yet (that's the post-hackathon step).
import { scryptSync, randomBytes, createHmac, timingSafeEqual } from 'node:crypto'

export interface Operator {
  id: string
  email: string
  name: string
  salt: string
  passwordHash: string
}

// The operator anonymous/demo traffic maps to. Owns the `camille` seed trip so the
// public demo needs no login.
export const DEFAULT_OPERATOR_ID = 'demo'

// scrypt(password, salt) → hex. Deterministic given salt, so we can seed hashes.
function hash(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString('hex')
}

// Build a seed operator with a freshly salted hash of a plaintext demo password.
function makeOperator(id: string, email: string, name: string, password: string): Operator {
  const salt = randomBytes(16).toString('hex')
  return { id, email, name, salt, passwordHash: hash(password, salt) }
}

// Seeded operators. `demo` is the additive fallback tenant; the other two are B2B
// operators whose names match clients already present in the fleet seed, so their
// portfolios feel real. Demo credentials are intentionally simple (hackathon).
const OPERATORS: Operator[] = [
  makeOperator(DEFAULT_OPERATOR_ID, 'demo@tripassist.fr', 'Démo TripAssist', 'demo'),
  makeOperator('axa', 'ops@axa-assistance.fr', 'AXA Assistance', 'axa2026'),
  makeOperator('handitour', 'ops@handitour.fr', "Handi'Tour", 'handi2026'),
]

const byId = new Map(OPERATORS.map((o) => [o.id, o]))
const byEmail = new Map(OPERATORS.map((o) => [o.email.toLowerCase(), o]))

export function getOperator(id: string): Operator | undefined {
  return byId.get(id)
}

// Public view of an operator (never leak salt/hash over the wire).
export interface OperatorPublic {
  id: string
  email: string
  name: string
}

export function publicOperator(op: Operator): OperatorPublic {
  return { id: op.id, email: op.email, name: op.name }
}

export function listOperators(): OperatorPublic[] {
  return OPERATORS.map(publicOperator)
}

// Verify an email+password pair. Constant-time compare on the hash. Returns the
// operator on success, else null (unknown email or wrong password).
export function verifyPassword(email: string, password: string): Operator | null {
  const op = byEmail.get(String(email || '').toLowerCase())
  if (!op) return null
  const candidate = Buffer.from(hash(password, op.salt), 'hex')
  const known = Buffer.from(op.passwordHash, 'hex')
  if (candidate.length !== known.length) return null
  return timingSafeEqual(candidate, known) ? op : null
}

// --- stateless signed session token -----------------------------------------
// token = base64url(operatorId) + '.' + hmacSHA256(secret, that). No server-side
// session store needed; tampering flips the HMAC so verify returns null.

function secret(): string {
  return process.env.SESSION_SECRET || 'tripassist-dev-session-secret'
}

function b64url(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url')
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function signSession(operatorId: string): string {
  const payload = b64url(operatorId)
  return `${payload}.${sign(payload)}`
}

// Returns the operator id if the token is well-formed and its signature checks out
// AND it names a known operator; otherwise null.
export function verifySession(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  const expected = sign(payload)
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  let id: string
  try {
    id = Buffer.from(payload, 'base64url').toString('utf8')
  } catch {
    return null
  }
  return byId.has(id) ? id : null
}

export const SESSION_COOKIE = 'at_session'

export default {
  DEFAULT_OPERATOR_ID,
  SESSION_COOKIE,
  getOperator,
  listOperators,
  publicOperator,
  verifyPassword,
  signSession,
  verifySession,
}
