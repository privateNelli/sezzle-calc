import { useEffect } from 'react'

import { CalculatorHistory } from './CalculatorHistory'
import type { HistoryEntry } from './history'

type HistorySheetProps = {
  open: boolean
  entries: HistoryEntry[]
  onClose: () => void
  onRecall: (value: number) => void
  onClear: () => void
}

export function HistorySheet({ open, entries, onClose, onRecall, onClear }: HistorySheetProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="history-sheet">
      <button type="button" className="sheet-backdrop" aria-label="Dismiss history" onClick={onClose} />
      <section className="bottom-sheet history-panel" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="sheet-handle" aria-hidden="true" />
        <CalculatorHistory
          entries={entries}
          onRecall={(value) => {
            onRecall(value)
            onClose()
          }}
          onClear={onClear}
          onClose={onClose}
        />
      </section>
    </div>
  )
}
