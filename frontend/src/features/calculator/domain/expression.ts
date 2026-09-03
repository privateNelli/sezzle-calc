import type { Operation } from './types'
import { formatOperand } from './format'

export const MAX_EXPRESSION_OPERANDS = 16

export type ExpressionDraft =
  | { kind: 'chain'; operands: number[]; operationIds: string[] }
  | { kind: 'unary'; operationId: string; value: number }

export type AnalyzedExpression =
  | {
      kind: 'unary'
      operation: string
      operands: number[]
      expression: string
      analysis: string
    }
  | {
      kind: 'chain'
      operands: number[]
      operations: string[]
      expression: string
      analysis: string
    }

export function analyzeExpression(draft: ExpressionDraft, operations: Operation[]): AnalyzedExpression {
  switch (draft.kind) {
    case 'chain':
      return analyzeChain(draft, operations)
    case 'unary':
      return analyzeUnary(draft, operations)
    default: {
      const _exhaustive: never = draft
      throw new Error(`Unhandled expression kind: ${String(_exhaustive)}`)
    }
  }
}

export function infixSymbol(operation: Operation): string {
  return operation.id === 'power' ? '^' : operation.symbol
}

export function formatChainExpression(operands: number[], operationIds: string[], operations: Operation[]): string {
  return operands
    .map((operand, index) => {
      const formatted = formatOperand(operand)
      const operationId = operationIds[index]
      if (!operationId) {
        return formatted
      }
      const operation = operations.find((item) => item.id === operationId)
      if (!operation) {
        throw new Error('The requested operation is not supported.')
      }
      return `${formatted} ${infixSymbol(operation)}`
    })
    .join(' ')
}

function analyzeChain(
  draft: Extract<ExpressionDraft, { kind: 'chain' }>,
  operations: Operation[],
): AnalyzedExpression {
  if (draft.operands.length < 2 || draft.operands.length > MAX_EXPRESSION_OPERANDS) {
    throw new Error('An expression must contain between 2 and 16 operands.')
  }
  if (draft.operationIds.length !== draft.operands.length - 1) {
    throw new Error('An expression must contain one binary operation between each operand.')
  }

  const resolved = draft.operationIds.map((operationId) => {
    const operation = operations.find((item) => item.id === operationId)
    if (!operation) {
      throw new Error('The requested operation is not supported.')
    }
    if (operation.arity !== 2) {
      throw new Error('Only binary operations can appear in a multi-step expression.')
    }
    return operation
  })

  const expression = formatChainExpression(draft.operands, draft.operationIds, operations)

  if (resolved.length === 1) {
    const operation = resolved[0]!
    const left = formatOperand(draft.operands[0]!)
    const right = formatOperand(draft.operands[1]!)
    return {
      kind: 'chain',
      operands: draft.operands,
      operations: draft.operationIds,
      expression,
      analysis: `${operation.label} of ${left} and ${right}`,
    }
  }

  return {
    kind: 'chain',
    operands: draft.operands,
    operations: draft.operationIds,
    expression,
    analysis: '',
  }
}

function analyzeUnary(
  draft: Extract<ExpressionDraft, { kind: 'unary' }>,
  operations: Operation[],
): AnalyzedExpression {
  const operation = operations.find((item) => item.id === draft.operationId)
  if (!operation) {
    throw new Error('The requested operation is not supported.')
  }
  if (operation.arity !== 1) {
    throw new Error(`${operation.label} requires exactly ${operation.arity} operand(s).`)
  }

  const value = formatOperand(draft.value)

  return {
    kind: 'unary',
    operation: operation.id,
    operands: [draft.value],
    expression: formatUnaryExpression(operation, value),
    analysis: `${operation.label} of ${value}`,
  }
}

function formatUnaryExpression(operation: Operation, value: string): string {
  if (operation.id === 'percentage') {
    return `${value}%`
  }
  if (operation.id === 'sqrt') {
    return `${operation.symbol}(${value})`
  }
  return `${operation.symbol}${value}`
}
