import type { Operation } from './api'
import { formatOperand } from './format'

export type ExpressionDraft =
  | { kind: 'binary'; operationId: string; left: number; right: number }
  | { kind: 'unary'; operationId: string; value: number }

export type AnalyzedExpression = {
  operation: string
  operands: number[]
  expression: string
  analysis: string
}

export function analyzeExpression(draft: ExpressionDraft, operations: Operation[]): AnalyzedExpression {
  const operation = operations.find((item) => item.id === draft.operationId)
  if (!operation) {
    throw new Error('The requested operation is not supported.')
  }

  switch (draft.kind) {
    case 'binary':
      return analyzeBinary(draft, operation)
    case 'unary':
      return analyzeUnary(draft, operation)
    default: {
      const _exhaustive: never = draft
      throw new Error(`Unhandled expression kind: ${String(_exhaustive)}`)
    }
  }
}

export function infixSymbol(operation: Operation): string {
  return operation.id === 'power' ? '^' : operation.symbol
}

function analyzeBinary(
  draft: Extract<ExpressionDraft, { kind: 'binary' }>,
  operation: Operation,
): AnalyzedExpression {
  if (operation.arity !== 2) {
    throw new Error(`${operation.label} requires exactly ${operation.arity} operand(s).`)
  }

  const left = formatOperand(draft.left)
  const right = formatOperand(draft.right)

  return {
    operation: operation.id,
    operands: [draft.left, draft.right],
    expression: `${left} ${infixSymbol(operation)} ${right}`,
    analysis: `${operation.label} of ${left} and ${right}`,
  }
}

function analyzeUnary(
  draft: Extract<ExpressionDraft, { kind: 'unary' }>,
  operation: Operation,
): AnalyzedExpression {
  if (operation.arity !== 1) {
    throw new Error(`${operation.label} requires exactly ${operation.arity} operand(s).`)
  }

  const value = formatOperand(draft.value)

  return {
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
