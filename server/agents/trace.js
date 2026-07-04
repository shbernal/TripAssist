// Agent reasoning trace (Sprint 2): makes the multi-agent orchestration visible.
// Agents emit `agent_state` (node lights up) and `agent_reasoning` (a thought
// streams into the trace). Small gaps let the audience SEE the agent think.
import { pushEvent } from '../events.js'

export function agentActive(agent, active = true) {
  pushEvent('agent_state', { agent, active })
}

export function think(agent, thought) {
  pushEvent('agent_reasoning', { agent, thought })
}

// Stream a sequence of thoughts for one agent, with a gap between each so the
// reasoning is legible on stage. Marks the node active for the duration.
export async function reason(agent, thoughts, { gap = 320, keepActive = false } = {}) {
  agentActive(agent, true)
  for (const t of thoughts) {
    await delay(gap)
    think(agent, t)
  }
  if (!keepActive) agentActive(agent, false)
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export default { agentActive, think, reason, delay }
