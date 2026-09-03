import { describe, expect, it } from 'vitest'

import { analyzeExpression, formatChainExpression } from './expression'
import type { Operation } from './types'

const operations: Operation[] = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'subtract', label: 'Subtraction', arity: 2, symbol: '−' },
  { id: 'multiply', label: 'Multiplication', arity: 2, symbol: '×' },
  { id: 'power', label: 'Exponentiation', arity: 2, symbol: 'xʸ' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
  { id: 'percentage', label: 'Percentage', arity: 1, symbol: '%' },
]

describe('analyzeExpression', () => {
  it('maps a binary pair to an evaluate payload and a readable expression', () => {
    expect(
      analyzeExpression({ kind: 'chain', operands: [48, 12], operationIds: ['add'] }, operations),
    ).toEqual({
      kind: 'chain',
      operands: [48, 12],
      operations: ['add'],
      expression: '48 + 12',
      analysis: 'Addition of 48 and 12',
    })
  })

  it('formats a multi-step expression without collapsing it to a pair', () => {
    expect(
      analyzeExpression(
        { kind: 'chain', operands: [1, 2, 3], operationIds: ['add', 'multiply'] },
        operations,
      ),
    ).toEqual({
      kind: 'chain',
      operands: [1, 2, 3],
      operations: ['add', 'multiply'],
      expression: '1 + 2 × 3',
      analysis: '',
    })
  })

  it('formats exponentiation with a caret instead of the keypad glyph', () => {
    expect(
      analyzeExpression({ kind: 'chain', operands: [2, 8], operationIds: ['power'] }, operations),
    ).toMatchObject({
      expression: '2 ^ 8',
      analysis: 'Exponentiation of 2 and 8',
    })
  })

  it('formats square root as a prefixed unary expression', () => {
    expect(
      analyzeExpression({ kind: 'unary', operationId: 'sqrt', value: 9 }, operations),
    ).toEqual({
      kind: 'unary',
      operation: 'sqrt',
      operands: [9],
      expression: '√(9)',
      analysis: 'Square root of 9',
    })
  })

  it('formats percentage as a suffixed unary expression', () => {
    expect(
      analyzeExpression({ kind: 'unary', operationId: 'percentage', value: 25 }, operations),
    ).toMatchObject({
      expression: '25%',
      operands: [25],
    })
  })

  it('rejects an unknown operation', () => {
    expect(() =>
      analyzeExpression({ kind: 'chain', operands: [1, 2], operationIds: ['modulo'] }, operations),
    ).toThrow('The requested operation is not supported.')
    expect(() => formatChainExpression([1], ['modulo'], operations)).toThrow(
      'The requested operation is not supported.',
    )
  })

  it('rejects a draft that does not match the operation arity', () => {
    expect(() =>
      analyzeExpression({ kind: 'unary', operationId: 'add', value: 4 }, operations),
    ).toThrow('Addition requires exactly 2 operand(s).')
  })

  it('rejects operand counts outside 2 to 16 and mismatched operators', () => {
    expect(() =>
      analyzeExpression({ kind: 'chain', operands: [1], operationIds: [] }, operations),
    ).toThrow('An expression must contain between 2 and 16 operands.')
    expect(() =>
      analyzeExpression(
        {
          kind: 'chain',
          operands: Array.from({ length: 17 }, () => 1),
          operationIds: Array.from({ length: 16 }, () => 'add'),
        },
        operations,
      ),
    ).toThrow('An expression must contain between 2 and 16 operands.')
    expect(() =>
      analyzeExpression({ kind: 'chain', operands: [1, 2, 3], operationIds: ['add'] }, operations),
    ).toThrow('An expression must contain one binary operation between each operand.')
  })

  it('rejects a unary operation inside a binary chain', () => {
    expect(() =>
      analyzeExpression({ kind: 'chain', operands: [9, 4], operationIds: ['sqrt'] }, operations),
    ).toThrow('Only binary operations can appear in a multi-step expression.')
  })

  it('rejects an unknown unary operation', () => {
    expect(() =>
      analyzeExpression({ kind: 'unary', operationId: 'abs', value: 4 }, operations),
    ).toThrow('The requested operation is not supported.')
  })

  it('prefixes a generic unary symbol when the operation is not percent or square root', () => {
    expect(
      analyzeExpression(
        { kind: 'unary', operationId: 'negate', value: 4 },
        [{ id: 'negate', label: 'Negate', arity: 1, symbol: '±' }],
      ),
    ).toMatchObject({
      expression: '±4',
      analysis: 'Negate of 4',
    })
  })
})
