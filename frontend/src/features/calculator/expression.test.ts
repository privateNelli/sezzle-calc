import { describe, expect, it } from 'vitest'

import { analyzeExpression } from './expression'
import type { Operation } from './api'

const operations: Operation[] = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'subtract', label: 'Subtraction', arity: 2, symbol: '−' },
  { id: 'multiply', label: 'Multiplication', arity: 2, symbol: '×' },
  { id: 'power', label: 'Exponentiation', arity: 2, symbol: 'xʸ' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
  { id: 'percentage', label: 'Percentage', arity: 1, symbol: '%' },
]

describe('analyzeExpression', () => {
  it('maps a binary draft to an API payload and a readable expression', () => {
    expect(
      analyzeExpression({ kind: 'binary', operationId: 'add', left: 48, right: 12 }, operations),
    ).toEqual({
      operation: 'add',
      operands: [48, 12],
      expression: '48 + 12',
      analysis: 'Addition of 48 and 12',
    })
  })

  it('formats exponentiation with a caret instead of the keypad glyph', () => {
    expect(
      analyzeExpression({ kind: 'binary', operationId: 'power', left: 2, right: 8 }, operations),
    ).toMatchObject({
      expression: '2 ^ 8',
      analysis: 'Exponentiation of 2 and 8',
    })
  })

  it('formats square root as a prefixed unary expression', () => {
    expect(
      analyzeExpression({ kind: 'unary', operationId: 'sqrt', value: 9 }, operations),
    ).toEqual({
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
      analyzeExpression({ kind: 'binary', operationId: 'modulo', left: 1, right: 2 }, operations),
    ).toThrow('The requested operation is not supported.')
  })

  it('rejects a draft that does not match the operation arity', () => {
    expect(() =>
      analyzeExpression({ kind: 'unary', operationId: 'add', value: 4 }, operations),
    ).toThrow('Addition requires exactly 2 operand(s).')
  })
})
