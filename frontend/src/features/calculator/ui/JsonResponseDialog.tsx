import { useEffect, useRef } from 'react'

import { formatEndpointJson, formatEndpointTime } from '../api/monitor'

type JsonResponseDialogProps = {
  title: string
  timestamp: string
  body: unknown
  onClose: () => void
}

export function JsonResponseDialog({ title, timestamp, body, onClose }: JsonResponseDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return (
    <div className="json-dialog-root">
      <button type="button" className="json-dialog-backdrop" aria-label="Dismiss JSON response" onClick={onClose} />
      <section className="json-dialog" role="dialog" aria-modal="true" aria-labelledby="json-dialog-title">
        <header className="json-dialog-header">
          <div>
            <h2 id="json-dialog-title">{title}</h2>
            <p className="json-dialog-time">{formatEndpointTime(timestamp)}</p>
          </div>
          <button ref={closeRef} type="button" className="history-clear" onClick={onClose}>
            Close
          </button>
        </header>
        <pre className="json-dialog-body">
          <code>{formatEndpointJson(body)}</code>
        </pre>
      </section>
    </div>
  )
}
