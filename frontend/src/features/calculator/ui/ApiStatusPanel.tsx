import { useState } from 'react'

import { formatEndpointTime, type EndpointSnapshot } from '../api/monitor'
import { useApiMonitor } from '../hooks/use-api-monitor'
import { JsonResponseDialog } from './JsonResponseDialog'

type ApiStatusPanelProps = {
  id?: string
}

export function ApiStatusPanel({ id = 'api-status-panel' }: ApiStatusPanelProps) {
  const snapshots = useApiMonitor()
  const [openId, setOpenId] = useState<EndpointSnapshot['id'] | null>(null)
  const openSnapshot = snapshots.find((snapshot) => snapshot.id === openId && snapshot.lastBody !== null)

  return (
    <section className="api-status" id={id} aria-labelledby="api-status-title">
      <h2 id="api-status-title">API</h2>
      <ul className="api-status-list">
        {snapshots.map((snapshot) => (
          <EndpointRow key={snapshot.id} snapshot={snapshot} onViewJson={() => setOpenId(snapshot.id)} />
        ))}
      </ul>
      {openSnapshot && openSnapshot.lastAt ? (
        <JsonResponseDialog
          title={`${openSnapshot.method} ${openSnapshot.path}`}
          timestamp={openSnapshot.lastAt}
          body={openSnapshot.lastBody}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </section>
  )
}

function EndpointRow({
  snapshot,
  onViewJson,
}: {
  snapshot: EndpointSnapshot
  onViewJson: () => void
}) {
  const title = `${snapshot.method} ${snapshot.path}`
  const hasResponse = snapshot.lastBody !== null && snapshot.lastAt !== null

  return (
    <li className="api-status-item" aria-label={title} aria-busy={snapshot.phase === 'calling'}>
      <div className="api-status-item-main">
        <p className="api-status-route">{title}</p>
        <p className="api-status-phase">{phaseLabel(snapshot)}</p>
        {snapshot.lastBody !== null && snapshot.lastAt !== null ? (
          <p className="api-status-time">{formatEndpointTime(snapshot.lastAt)}</p>
        ) : (
          <p className="api-status-time">No response yet</p>
        )}
      </div>
      <button
        type="button"
        className="api-status-json"
        onClick={onViewJson}
        disabled={!hasResponse}
      >
        View JSON response
      </button>
    </li>
  )
}

function phaseLabel(snapshot: EndpointSnapshot): string {
  switch (snapshot.phase) {
    case 'idle':
      return 'Idle'
    case 'calling':
      return 'Calling…'
    case 'ok':
      return snapshot.lastStatus === null ? 'OK' : `OK ${snapshot.lastStatus}`
    case 'error':
      return snapshot.lastStatus === null ? 'Error' : `Error ${snapshot.lastStatus}`
    default: {
      const _exhaustive: never = snapshot.phase
      throw new Error(`Unhandled endpoint phase: ${String(_exhaustive)}`)
    }
  }
}
