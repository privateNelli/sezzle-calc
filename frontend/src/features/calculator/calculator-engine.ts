import type { Operation } from './api'
import { analyzeExpression, infixSymbol, type AnalyzedExpression } from './expression'
import { formatOperand } from './format'

const MAX_DIGITS = 9

export type ClearLabel = 'AC' | 'C'

export type EngineState = {
  input: string
  overwrite: boolean
  leftOperand: number | null
  pendingOperationId: string | null
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
      queuedOperationId: string | null
    }
  | { type: 'fail'; message: string }
  | { type: 'recall'; value: number }

export type CalculateEffect = {
  type: 'calculate'
  analyzed: AnalyzedExpression
  recordHistory: boolean
  queuedOperationId: string | null
}

export type EngineResult = {
  state: EngineState
  effect?: CalculateEffect
}

export function createInitialState(): EngineState {
  return {
    input: '0',
    overwrite: true,
    leftOperand: null,
    pendingOperationId: null,
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
      return { state: applySucceed(state, action, operations) }
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
    const startingFresh = state.pendingOperationId === null
    const input = digit
    return {
      ...state,
      input,
      overwrite: false,
      error: null,
      expression: startingFresh ? '' : state.expression,
      analysis: startingFresh ? null : state.analysis,
      lastBinary: startingFresh ? null : state.lastBinary,
      leftOperand: startingFresh ? null : state.leftOperand,
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
    const startingFresh = state.pendingOperationId === null
    return {
      ...state,
      input: '0.',
      overwrite: false,
      error: null,
      expression: startingFresh ? '' : state.expression,
      analysis: startingFresh ? null : state.analysis,
      lastBinary: startingFresh ? null : state.lastBinary,
      leftOperand: startingFresh ? null : state.leftOperand,
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
    return enqueueAnalysis(state, operations, {
      kind: 'unary',
      operationId: operation.id,
      value: currentValue(state),
    }, true, null)
  }

  if (operation.arity !== 2) {
    return { state }
  }

  const shouldEvaluatePending =
    state.pendingOperationId !== null && !state.overwrite && state.leftOperand !== null

  if (shouldEvaluatePending && state.pendingOperationId !== null && state.leftOperand !== null) {
    return enqueueAnalysis(
      state,
      operations,
      {
        kind: 'binary',
        operationId: state.pendingOperationId,
        left: state.leftOperand,
        right: currentValue(state),
      },
      false,
      operation.id,
    )
  }

  const leftOperand = currentValue(state)
  return {
    state: {
      ...state,
      leftOperand,
      pendingOperationId: operation.id,
      overwrite: true,
      error: null,
      analysis: null,
      expression: previewExpression(leftOperand, operation),
      clearLabel: 'AC',
    },
  }
}

function applyEquals(state: EngineState, operations: Operation[]): EngineResult {
  if (isErrorInput(state.input)) {
    return { state }
  }

  if (state.pendingOperationId !== null && state.leftOperand !== null) {
    return enqueueAnalysis(
      state,
      operations,
      {
        kind: 'binary',
        operationId: state.pendingOperationId,
        left: state.leftOperand,
        right: currentValue(state),
      },
      true,
      null,
    )
  }

  if (state.lastBinary) {
    return enqueueAnalysis(
      state,
      operations,
      {
        kind: 'binary',
        operationId: state.lastBinary.operationId,
        left: currentValue(state),
        right: state.lastBinary.right,
      },
      true,
      null,
    )
  }

  return { state }
}

function applySucceed(
  state: EngineState,
  action: Extract<EngineAction, { type: 'succeed' }>,
  operations: Operation[],
): EngineState {
  const input = formatOperand(action.result)
  const queued = action.queuedOperationId
    ? operations.find((item) => item.id === action.queuedOperationId)
    : undefined
  const lastBinary =
    action.analyzed.operands.length === 2
      ? { operationId: action.analyzed.operation, right: action.analyzed.operands[1]! }
      : state.lastBinary

  if (queued) {
    return {
      ...state,
      input,
      overwrite: true,
      error: null,
      leftOperand: action.result,
      pendingOperationId: queued.id,
      lastBinary,
      analysis: action.analyzed.analysis,
      expression: previewExpression(action.result, queued),
      clearLabel: 'AC',
    }
  }

  return {
    ...state,
    input,
    overwrite: true,
    error: null,
    leftOperand: action.result,
    pendingOperationId: null,
    lastBinary,
    analysis: action.analyzed.analysis,
    expression: action.analyzed.expression,
    clearLabel: 'AC',
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
    leftOperand: value,
    clearLabel: 'AC',
  }
}

function enqueueAnalysis(
  state: EngineState,
  operations: Operation[],
  draft: Parameters<typeof analyzeExpression>[0],
  recordHistory: boolean,
  queuedOperationId: string | null,
): EngineResult {
  try {
    return {
      state,
      effect: {
        type: 'calculate',
        analyzed: analyzeExpression(draft, operations),
        recordHistory,
        queuedOperationId,
      },
    }
  } catch (error) {
    return {
      state: applyFail(error instanceof Error ? error.message : 'Unable to analyze the expression.'),
    }
  }
}

function previewExpression(left: number, operation: Operation): string {
  return `${formatOperand(left)} ${infixSymbol(operation)}`
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
