// SSE hub. One /events stream; pushEvent(type, payload) fans out to every client.
import type { Response } from 'express'
import type { ServerEventMap, ServerEventType } from '../shared/types.js'

const clients = new Set<Response>()

export function addClient(res: Response): void {
  clients.add(res)
  res.on('close', () => clients.delete(res))
}

export function clientCount(): number {
  return clients.size
}

// Broadcast a named event to all connected SSE clients. The payload type is tied
// to the event name via ServerEventMap, so both server and web agree on the wire.
export function pushEvent<T extends ServerEventType>(type: T, payload: ServerEventMap[T]) {
  const data = JSON.stringify({ type, payload, at: isoNow() })
  for (const res of clients) {
    try {
      res.write(`event: ${type}\n`)
      res.write(`data: ${data}\n\n`)
    } catch {
      clients.delete(res)
    }
  }
  return { type, payload }
}

// Timestamp helper (Date.now is fine on the server; the sandbox restriction is script-side only).
function isoNow(): string | null {
  try {
    return new Date().toISOString()
  } catch {
    return null
  }
}
