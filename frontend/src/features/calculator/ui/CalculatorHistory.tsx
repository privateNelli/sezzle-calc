import { formatOperand } from '../domain/format'
import type { HistoryEntry } from '../domain/history'

type CalculatorHistoryProps = {
  entries: HistoryEntry[]
  onRecall: (value: number) => void
  onClear: () => void
  onClose?: () => void
  autoFocusClose?: boolean
}

export function CalculatorHistory({
  entries,
  onRecall,
  onClear,
  onClose,
  autoFocusClose = false,
}: CalculatorHistoryProps) {
  return (
    <div className="calculator-history">
      <header className="history-header">
        <h2 id="history-title">History</h2>
        <div className="history-actions">
          {entries.length > 0 && (
            <button type="button" className="history-clear" onClick={onClear}>
              Clear
            </button>
          )}
          {onClose ? (
            <button type="button" className="history-clear" onClick={onClose} autoFocus={autoFocusClose}>
              Done
            </button>
          ) : null}
        </div>
      </header>

      {entries.length === 0 ? (
        <p className="history-empty" role="status">
          No calculations yet.
        </p>
      ) : (
        <ul className="history-list" aria-label="Calculation history">
          {entries.map((entry) => {
            const result = formatOperand(entry.result)
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className="history-item"
                  onClick={() => onRecall(entry.result)}
                  aria-label={`Recall ${entry.expression} = ${result}`}
                >
                  <span className="history-expression">{entry.expression}</span>
                  <span className="history-result">= {result}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
