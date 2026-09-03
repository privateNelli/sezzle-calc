import { useCallback, useEffect, useRef, useState } from 'react'

import { calculate, evaluate } from '../api/client'
import {
  createInitialState,
  pendingOperationId,
  reduce,
  type EngineAction,
  type EngineState,
} from '../domain/engine'
import type { AnalyzedExpression } from '../domain/expression'
import {
  addHistoryEntry,
  HISTORY_STORAGE_KEY,
  parseHistory,
  serializeHistory,
  type HistoryEntry,
} from '../domain/history'
import type { Operation } from '../domain/types'

export function useCalculator(operations: Operation[]) {
  const [state, setState] = useState<EngineState>(createInitialState)
  const [history, setHistory] = useState<HistoryEntry[]>(readStoredHistory)
  const [isCalculating, setIsCalculating] = useState(false)
  const stateRef = useRef(state)
  const busyRef = useRef(false)

  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(history))
  }, [history])

  const dispatch = useCallback(
    async (action: EngineAction) => {
      if (busyRef.current && action.type !== 'succeed' && action.type !== 'fail') {
        return
      }

      const reduced = reduce(stateRef.current, action, operations)
      stateRef.current = reduced.state
      setState(reduced.state)

      const effect = reduced.effect
      if (!effect) {
        return
      }

      busyRef.current = true
      setIsCalculating(true)

      try {
        const result = await requestCalculation(effect.analyzed)
        const success = reduce(
          stateRef.current,
          {
            type: 'succeed',
            result,
            analyzed: effect.analyzed,
            recordHistory: effect.recordHistory,
          },
          operations,
        )
        stateRef.current = success.state
        setState(success.state)

        if (effect.recordHistory) {
          setHistory((current) =>
            addHistoryEntry(current, {
              expression: effect.analyzed.expression,
              analysis: effect.analyzed.analysis,
              result,
            }),
          )
        }
      } catch (error) {
        const failed = reduce(
          stateRef.current,
          {
            type: 'fail',
            message: error instanceof Error ? error.message : 'Unable to complete the calculation.',
          },
          operations,
        )
        stateRef.current = failed.state
        setState(failed.state)
      } finally {
        busyRef.current = false
        setIsCalculating(false)
      }
    },
    [operations],
  )

  const recall = useCallback(
    (value: number) => {
      void dispatch({ type: 'recall', value })
    },
    [dispatch],
  )

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    ...state,
    pendingOperationId: pendingOperationId(state),
    history,
    isCalculating,
    dispatch,
    recall,
    clearHistory,
  }
}

function readStoredHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  return parseHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY))
}

async function requestCalculation(analyzed: AnalyzedExpression): Promise<number> {
  switch (analyzed.kind) {
    case 'unary': {
      const calculation = await calculate({
        operation: analyzed.operation,
        operands: analyzed.operands,
      })
      return calculation.result
    }
    case 'chain': {
      const evaluation = await evaluate({
        operands: analyzed.operands,
        operations: analyzed.operations,
      })
      return evaluation.result
    }
    default: {
      const _exhaustive: never = analyzed
      throw new Error(`Unhandled analyzed expression: ${String(_exhaustive)}`)
    }
  }
}
