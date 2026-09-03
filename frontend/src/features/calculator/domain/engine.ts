import type { Operation } from './types'
import {
  analyzeExpression,
  formatChainExpression,
  MAX_EXPRESSION_OPERANDS,
  type AnalyzedExpression,
} from './expression'
import { formatOperand } from './format'

const MAX_DIGITS = 9

export type ClearLabel = 'AC' | 'C'

export type EngineState = {
  input: string
  overwrite: boolean
  operands: number[]
  operators: string[]
  lastBinary: { operationId: string; right: number } | null
  expression: string
  analysis: string | null
  error: string | null
  clearLabel: ClearLabel
}

export type EngineAction =
  | { type: 'digit'; digit: string }
  | { type: 'decimal' }
  | { type: 'sign' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'operation'; operationId: string }
  | { type: 'equals' }
  | {
      type: 'succeed'
      result: number
      analyzed: AnalyzedExpression
      recordHistory: boolean
    }
  | { type: 'fail'; message: string }
  | { type: 'recall'; value: number }

export type CalculateEffect = {
  type: 'calculate'
  analyzed: AnalyzedExpression
  recordHistory: boolean
}

export type EngineResult = {
  state: EngineState
  effect?: CalculateEffect
}

export function createInitialState(): EngineState {
  return {
    input: '0',
    overwrite: true,
    operands: [],
    operators: [],
    lastBinary: null,
    expression: '',
    analysis: null,
    error: null,
    clearLabel: 'AC',
  }
}

export function currentValue(state: EngineState): number {
  if (state.input === 'Error') {
    return Number.NaN
  }
  return Number(state.input)
}

export function pendingOperationId(state: EngineState): string | null {
  if (state.operators.length === 0 || state.operators.length !== state.operands.length) {
    return null
  }
  return state.operators[state.operators.length - 1] ?? null
}

export function reduce(state: EngineState, action: EngineAction, operations: Operation[]): EngineResult {
  switch (action.type) {
    case 'digit':
      return { state: applyDigit(state, action.digit) }
    case 'decimal':
      return { state: applyDecimal(state) }
    case 'sign':
      return { state: applySign(state) }
    case 'clear':
      return { state: applyClear(state) }
    case 'backspace':
      return { state: applyBackspace(state) }
    case 'operation':
      return applyOperation(state, action.operationId, operations)
    case 'equals':
      return applyEquals(state, operations)
    case 'succeed':
      return { state: applySucceed(state, action) }
    case 'fail':
      return { state: applyFail(action.message) }
    case 'recall':
      return { state: applyRecall(action.value) }
    default: {
      const _exhaustive: never = action
      void _exhaustive
      return { state }
    }
  }
}

function applyDigit(state: EngineState, digit: string): EngineState {
  if (isErrorInput(state.input) || state.overwrite) {
    const startingFresh = !isExpressionOpen(state)
    const input = digit
    return {
      ...state,
      input,
      overwrite: false,
      error: null,
      expression: startingFresh ? '' : state.expression,
      analysis: startingFresh ? null : state.analysis,
      lastBinary: startingFresh ? null : state.lastBinary,
      operands: startingFresh ? [] : state.operands,
      operators: startingFresh ? [] : state.operators,
      clearLabel: labelFor(input, false),
    }
  }

  if (state.input === '0' || state.input === '-0') {
    const sign = state.input.startsWith('-') ? '-' : ''
    const input = `${sign}${digit}`
    return { ...state, input, error: null, clearLabel: labelFor(input, false) }
  }

  if (digitCount(state.input) >= MAX_DIGITS) {
    return state
  }

  const input = `${state.input}${digit}`
  return { ...state, input, error: null, clearLabel: 'C' }
}

function applyDecimal(state: EngineState): EngineState {
  if (isErrorInput(state.input) || state.overwrite) {
    const startingFresh = !isExpressionOpen(state)
    return {
      ...state,
      input: '0.',
      overwrite: false,
      error: null,
      expression: startingFresh ? '' : state.expression,
      analysis: startingFresh ? null : state.analysis,
      lastBinary: startingFresh ? null : state.lastBinary,
      operands: startingFresh ? [] : state.operands,
      operators: startingFresh ? [] : state.operators,
      clearLabel: 'C',
    }
  }

  if (state.input.includes('.')) {
    return state
  }

  return { ...state, input: `${state.input}.`, clearLabel: 'C' }
}

function applySign(state: EngineState): EngineState {
  if (isErrorInput(state.input)) {
    return state
  }

  const input = state.input.startsWith('-') ? state.input.slice(1) : `-${state.input}`
  return { ...state, input, clearLabel: labelFor(input, state.overwrite) }
}

function applyClear(state: EngineState): EngineState {
  if (state.clearLabel === 'C') {
    return {
      ...state,
      input: '0',
      overwrite: true,
      error: null,
      clearLabel: 'AC',
    }
  }

  return createInitialState()
}

function applyBackspace(state: EngineState): EngineState {
  if (state.overwrite || isErrorInput(state.input)) {
    return state
  }

  if (state.input.length <= 1 || (state.input.startsWith('-') && state.input.length === 2)) {
    return { ...state, input: '0', clearLabel: 'AC' }
  }

  const input = state.input.slice(0, -1)
  return { ...state, input, clearLabel: labelFor(input, false) }
}

function applyOperation(state: EngineState, operationId: string, operations: Operation[]): EngineResult {
  const operation = operations.find((item) => item.id === operationId)
  if (!operation || isErrorInput(state.input)) {
    return { state }
  }

  if (operation.arity === 1) {
    return enqueueAnalysis(
      state,
      operations,
      {
        kind: 'unary',
        operationId: operation.id,
        value: currentValue(state),
      },
      !isExpressionOpen(state),
    )
  }

  if (operation.arity !== 2) {
    return { state }
  }

  if (state.overwrite && isExpressionOpen(state)) {
    const operators = [...state.operators.slice(0, -1), operation.id]
    return {
      state: {
        ...state,
        operators,
        error: null,
        analysis: null,
        expression: formatChainExpression(state.operands, operators, operations),
        clearLabel: 'AC',
      },
    }
  }

  if (state.operands.length >= MAX_EXPRESSION_OPERANDS - 1) {
    return {
      state: applyFail('An expression must contain between 2 and 16 operands.'),
    }
  }

  const operands = [...state.operands, currentValue(state)]
  const operators = [...state.operators, operation.id]

  return {
    state: {
      ...state,
      operands,
      operators,
      overwrite: true,
      error: null,
      analysis: null,
      expression: formatChainExpression(operands, operators, operations),
      clearLabel: 'AC',
    },
  }
}

function applyEquals(state: EngineState, operations: Operation[]): EngineResult {
  if (isErrorInput(state.input)) {
    return { state }
  }

  if (isExpressionOpen(state)) {
    return enqueueAnalysis(
      state,
      operations,
      {
        kind: 'chain',
        operands: [...state.operands, currentValue(state)],
        operationIds: state.operators,
      },
      true,
    )
  }

  if (state.lastBinary) {
    return enqueueAnalysis(
      state,
      operations,
      {
        kind: 'chain',
        operands: [currentValue(state), state.lastBinary.right],
        operationIds: [state.lastBinary.operationId],
      },
      true,
    )
  }

  return { state }
}

function applySucceed(
  state: EngineState,
  action: Extract<EngineAction, { type: 'succeed' }>,
): EngineState {
  const input = formatOperand(action.result)

  switch (action.analyzed.kind) {
    case 'unary':
      if (isExpressionOpen(state)) {
        return {
          ...state,
          input,
          overwrite: true,
          error: null,
          analysis: action.analyzed.analysis,
          clearLabel: 'AC',
        }
      }

      return {
        ...state,
        input,
        overwrite: true,
        error: null,
        operands: [],
        operators: [],
        analysis: action.analyzed.analysis,
        expression: action.analyzed.expression,
        clearLabel: 'AC',
      }
    case 'chain': {
      const lastOperationId = action.analyzed.operations[action.analyzed.operations.length - 1]
      const lastOperand = action.analyzed.operands[action.analyzed.operands.length - 1]
      const lastBinary =
        lastOperationId !== undefined && lastOperand !== undefined
          ? { operationId: lastOperationId, right: lastOperand }
          : null

      return {
        ...state,
        input,
        overwrite: true,
        error: null,
        operands: [],
        operators: [],
        lastBinary,
        analysis: action.analyzed.analysis,
        expression: action.analyzed.expression,
        clearLabel: 'AC',
      }
    }
    default: {
      const _exhaustive: never = action.analyzed
      void _exhaustive
      return state
    }
  }
}

function applyFail(message: string): EngineState {
  return {
    ...createInitialState(),
    input: 'Error',
    overwrite: true,
    error: message,
    clearLabel: 'AC',
  }
}

function applyRecall(value: number): EngineState {
  const input = formatOperand(value)
  return {
    ...createInitialState(),
    input,
    overwrite: true,
    clearLabel: 'AC',
  }
}

function enqueueAnalysis(
  state: EngineState,
  operations: Operation[],
  draft: Parameters<typeof analyzeExpression>[0],
  recordHistory: boolean,
): EngineResult {
  try {
    return {
      state,
      effect: {
        type: 'calculate',
        analyzed: analyzeExpression(draft, operations),
        recordHistory,
      },
    }
  } catch (error) {
    return {
      state: applyFail(error instanceof Error ? error.message : 'Unable to analyze the expression.'),
    }
  }
}

function isExpressionOpen(state: EngineState): boolean {
  return state.operands.length > 0 && state.operators.length === state.operands.length
}

function digitCount(input: string): number {
  return input.replace(/\D/g, '').length
}

function labelFor(input: string, overwrite: boolean): ClearLabel {
  if (overwrite || isErrorInput(input) || input === '0' || input === '-0') {
    return 'AC'
  }
  return 'C'
}

function isErrorInput(input: string): boolean {
  return input === 'Error'
}
