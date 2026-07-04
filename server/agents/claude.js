// Thin Claude Messages API client (raw fetch — no SDK dependency).
// Supports a custom base URL (e.g. an enterprise gateway) via ANTHROPIC_BASE_URL.
// Every agent that calls this MUST have a hardcoded fallback: the demo never breaks.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8'

export function hasClaude() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

// Auth headers: a direct API key uses x-api-key; a gateway / OAuth token (e.g.
// the Capgemini gateway) uses Authorization: Bearer + the oauth beta header.
export function authHeaders() {
  if (process.env.ANTHROPIC_API_KEY) {
    return { 'x-api-key': process.env.ANTHROPIC_API_KEY }
  }
  return {
    Authorization: `Bearer ${process.env.ANTHROPIC_AUTH_TOKEN}`,
    'anthropic-beta': 'oauth-2025-04-20',
  }
}

export function baseUrl() {
  return (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '')
}

// Call Claude and return parsed JSON matching `schema` (a JSON Schema object).
// Throws on any failure so callers can fall back deterministically.
export async function claudeJSON({ system, user, schema, maxTokens = 1500, timeoutMs = 12000 }) {
  if (!hasClaude()) throw new Error('ANTHROPIC_API_KEY not set')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${baseUrl()}/v1/messages`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        ...authHeaders(),
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        thinking: { type: 'adaptive' },
        output_config: { format: { type: 'json_schema', schema } },
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!res.ok) throw new Error(`Claude HTTP ${res.status}: ${await res.text().catch(() => '')}`)
    const data = await res.json()
    const textBlock = (data.content || []).find((b) => b.type === 'text')
    if (!textBlock) throw new Error('No text block in Claude response')
    return JSON.parse(textBlock.text)
  } finally {
    clearTimeout(timer)
  }
}

export default { hasClaude, claudeJSON }
