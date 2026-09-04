import type { EngineAction } from '../domain/engine'
import { buildKeypadRows, type PadKey } from '../domain/keypad'
import type { Operation } from '../domain/types'
import type { Theme } from '../hooks/use-theme'

type CalculatorPadProps = {
  operations: Operation[]
  clearLabel: 'AC' | 'C'
  activeOperationId: string | null
  theme: Theme
  showHistoryToggle: boolean
  historyOpen: boolean
  onToggleHistory: () => void
  onToggleTheme: () => void
  onDispatch: (action: EngineAction) => void
}

export function CalculatorPad({
  operations,
  clearLabel,
  activeOperationId,
  theme,
  showHistoryToggle,
  historyOpen,
  onToggleHistory,
  onToggleTheme,
  onDispatch,
}: CalculatorPadProps) {
  const rows = buildKeypadRows(operations, clearLabel)
  const lastIndex = rows.length - 1
  const utilityCount = showHistoryToggle ? 2 : 1
  const lastRowHasRoom = (rows[lastIndex]?.length ?? 0) <= 4 - utilityCount

  return (
    <div className="calculator-pad">
      {rows.map((row, index) => (
        <div className="pad-row" key={row.map((key) => key.id).join('-')}>
          {row.map((key) => (
            <KeyButton
              key={key.id}
              padKey={key}
              active={key.kind === 'operation' && key.operationId === activeOperationId}
              onDispatch={onDispatch}
            />
          ))}
          {index === lastIndex && lastRowHasRoom ? (
            <UtilityKeys
              theme={theme}
              showHistoryToggle={showHistoryToggle}
              historyOpen={historyOpen}
              onToggleHistory={onToggleHistory}
              onToggleTheme={onToggleTheme}
            />
          ) : null}
        </div>
      ))}
      {!lastRowHasRoom ? (
        <div className="pad-row">
          <UtilityKeys
            theme={theme}
            showHistoryToggle={showHistoryToggle}
            historyOpen={historyOpen}
            onToggleHistory={onToggleHistory}
            onToggleTheme={onToggleTheme}
          />
        </div>
      ) : null}
    </div>
  )
}

type UtilityKeysProps = {
  theme: Theme
  showHistoryToggle: boolean
  historyOpen: boolean
  onToggleHistory: () => void
  onToggleTheme: () => void
}

function UtilityKeys({
  theme,
  showHistoryToggle,
  historyOpen,
  onToggleHistory,
  onToggleTheme,
}: UtilityKeysProps) {
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <>
      {showHistoryToggle ? (
        <button
          type="button"
          className="key key-light"
          aria-label="History"
          aria-expanded={historyOpen}
          onClick={onToggleHistory}
        >
          <HistoryIcon />
        </button>
      ) : null}
      <button type="button" className="key key-light" aria-label={themeLabel} onClick={onToggleTheme}>
        <span className="theme-glyph">
          <SunIcon />
          <MoonIcon />
        </span>
      </button>
    </>
  )
}

type KeyButtonProps = {
  padKey: PadKey
  active: boolean
  onDispatch: (action: EngineAction) => void
}

function KeyButton({ padKey, active, onDispatch }: KeyButtonProps) {
  return (
    <button
      type="button"
      className={keyClassName(padKey, active)}
      aria-label={padKey.ariaLabel}
      aria-pressed={padKey.kind === 'operation' ? active : undefined}
      onClick={() => dispatchKey(padKey, onDispatch)}
    >
      {padKey.label}
    </button>
  )
}

function dispatchKey(padKey: PadKey, onDispatch: (action: EngineAction) => void) {
  switch (padKey.kind) {
    case 'digit':
      onDispatch({ type: 'digit', digit: padKey.digit })
      break
    case 'decimal':
      onDispatch({ type: 'decimal' })
      break
    case 'equals':
      onDispatch({ type: 'equals' })
      break
    case 'clear':
      onDispatch({ type: 'clear' })
      break
    case 'sign':
      onDispatch({ type: 'sign' })
      break
    case 'operation':
      onDispatch({ type: 'operation', operationId: padKey.operationId })
      break
    default: {
      const _exhaustive: never = padKey
      void _exhaustive
    }
  }
}

function keyClassName(padKey: PadKey, active: boolean): string {
  const classes = ['key']

  switch (padKey.kind) {
    case 'digit':
    case 'decimal':
      classes.push('key-dark')
      if (padKey.kind === 'digit' && padKey.wide) {
        classes.push('key-wide')
      }
      break
    case 'equals':
    case 'operation':
      classes.push(padKey.kind === 'operation' && padKey.variant === 'function' ? 'key-light' : 'key-accent')
      if (active) {
        classes.push('key-active')
      }
      break
    case 'clear':
    case 'sign':
      classes.push('key-light')
      break
    default: {
      const _exhaustive: never = padKey
      void _exhaustive
    }
  }

  return classes.join(' ')
}

function HistoryIcon() {
  return (
    <svg className="key-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 9.5V13l2.5 1.5M9 4.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="key-icon theme-glyph-sun" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="key-icon theme-glyph-moon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 4.2A7.8 7.8 0 1 0 19.8 14 6.2 6.2 0 0 1 15 4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
