import React from 'react'
import Watchlist from './Watchlist.jsx'
import Ledger from './Ledger.jsx'
import AgentLog from './AgentLog.jsx'
import ReplanCard from './ReplanCard.jsx'
import CallPanel from './CallPanel.jsx'
import VisionCheck from './VisionCheck.jsx'
import KpiBand from './KpiBand.jsx'
import AgentGraph from './AgentGraph.jsx'

// Operations control center. Watchlist + agent log + ledger + remediation card.
// Later milestones drop CallPanel / VisionCheck into this grid.
export default function OpsView({ state, reload }) {
  return (
    <div className="page">
      <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>Centre de contrôle</h1>
      <p className="muted" style={{ marginTop: '-0.4rem' }}>
        Voyageuse : {state.traveler.name} · {state.trip.label}
      </p>

      <KpiBand state={state} />

      <AgentGraph agentStates={state.agentStates} reasoning={state.reasoning} />

      <div className="ops-grid">
        <Watchlist steps={state.trip.steps} />
        <AgentLog log={state.agentLog} />
        <CallPanel call={state.call} transcript={state.transcript} />
        <ReplanCard replan={state.replan} onApplied={reload} />
        <VisionCheck verdict={state.visionVerdict} />
        <Ledger ledger={state.ledger} />
      </div>
    </div>
  )
}
