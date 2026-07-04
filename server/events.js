// SSE hub. One /events stream; pushEvent(type, payload) fans out to every client.
const clients = new Set()

export function addClient(res) {
  clients.add(res)
  res.on('close', () => clients.delete(res))
}

export function clientCount() {
  return clients.size
}

// Broadcast a named event to all connected SSE clients.
export function pushEvent(type, payload = {}) {
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
function isoNow() {
  try {
    return new Date().toISOString()
  } catch {
    return null
  }
}

export default { addClient, pushEvent, clientCount }
