import React from 'react'
import Watchlist from './Watchlist'
import Ledger from './Ledger'
import AgentLog from './AgentLog'
import ReplanCard from './ReplanCard'
import CallPanel from './CallPanel'
import VisionCheck from './VisionCheck'
import KpiBand from './KpiBand'
import AgentGraph from './AgentGraph'
import RealContext from './RealContext'
import OperatorPanel from './OperatorPanel'
import type { AppState } from '../../../shared/types'

interface OpsViewProps {
  state: AppState
  reload: () => Promise<AppState>
}

// Operations control center. Watchlist + agent log + ledger + remediation card.
// Later milestones drop CallPanel / VisionCheck into this grid.
export default function OpsView({ state, reload }: OpsViewProps) {
  return (
    <div className="page">
      <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>Centre de contrôle</h1>
      <p className="muted" style={{ marginTop: '-0.4rem' }}>
        Voyageuse : {state.traveler.name} · {state.trip.label}
      </p>

      <RealContext />

      <OperatorPanel />

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
