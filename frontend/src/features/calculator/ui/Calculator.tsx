import { useEffect, useState } from 'react'

import type { Operation } from '../domain/types'
import { useCalculator } from '../hooks/use-calculator'
import { useDesktopLayout } from '../hooks/use-desktop-layout'
import { useTheme } from '../hooks/use-theme'
import { ApiStatusAccordion } from './ApiStatusAccordion'
import { ApiStatusPanel } from './ApiStatusPanel'
import { CalculatorDisplay } from './CalculatorDisplay'
import { CalculatorHistory } from './CalculatorHistory'
import { CalculatorPad } from './CalculatorPad'
import { HistorySheet } from './HistorySheet'

type CalculatorProps = {
  operations: Operation[]
}

export function Calculator({ operations }: CalculatorProps) {
  const {
    input,
    expression,
    error,
    overwrite,
    pendingOperationId,
    clearLabel,
    history,
    isCalculating,
    dispatch,
    recall,
    clearHistory,
  } = useCalculator(operations)
  const { theme, toggleTheme } = useTheme()
  const isDesktop = useDesktopLayout()
  const [historyOpen, setHistoryOpen] = useState(false)
  const activeOperationId = overwrite ? pendingOperationId : null

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (historyOpen && !isDesktop) {
        if (event.key === 'Escape') {
          event.preventDefault()
          setHistoryOpen(false)
        }
        return
      }

      const action = actionFromKeyboard(event.key)
      if (!action) {
        return
      }

      event.preventDefault()
      void dispatch(action)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, historyOpen, isDesktop])

  return (
    <div className="workspace">
      <section className="calculator-device" aria-label="Calculator" aria-busy={isCalculating}>
        <CalculatorDisplay expression={expression} value={input} error={error} />
        <CalculatorPad
          operations={operations}
          clearLabel={clearLabel}
          activeOperationId={activeOperationId}
          theme={theme}
          showHistoryToggle={!isDesktop}
          historyOpen={historyOpen}
          onToggleHistory={() => setHistoryOpen((open) => !open)}
          onToggleTheme={toggleTheme}
          onDispatch={(action) => {
            void dispatch(action)
          }}
        />
      </section>
      {isDesktop ? (
        <aside className="history-panel" aria-labelledby="history-title">
          <CalculatorHistory entries={history} onRecall={recall} onClear={clearHistory} />
          <ApiStatusPanel />
        </aside>
      ) : (
        <>
          <HistorySheet
            entries={history}
            open={historyOpen}
            onRecall={recall}
            onClear={clearHistory}
            onClose={() => setHistoryOpen(false)}
          />
          <ApiStatusAccordion />
        </>
      )}
    </div>
  )
}

function actionFromKeyboard(key: string) {
  if (key >= '0' && key <= '9') {
    return { type: 'digit' as const, digit: key }
  }

  switch (key) {
    case '.':
      return { type: 'decimal' as const }
    case '+':
      return { type: 'operation' as const, operationId: 'add' }
    case '-':
      return { type: 'operation' as const, operationId: 'subtract' }
    case '*':
      return { type: 'operation' as const, operationId: 'multiply' }
    case '/':
      return { type: 'operation' as const, operationId: 'divide' }
    case '%':
      return { type: 'operation' as const, operationId: 'percentage' }
    case 'Enter':
    case '=':
      return { type: 'equals' as const }
    case 'Escape':
      return { type: 'clear' as const }
    case 'Backspace':
      return { type: 'backspace' as const }
    default:
      return null
  }
}
