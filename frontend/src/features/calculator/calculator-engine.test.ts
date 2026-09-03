import { describe, expect, it } from 'vitest'

import { createInitialState, reduce } from './calculator-engine'
import type { Operation } from './api'

const operations: Operation[] = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'multiply', label: 'Multiplication', arity: 2, symbol: '×' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
  { id: 'percentage', label: 'Percentage', arity: 1, symbol: '%' },
]

describe('calculator engine', () => {
  it('replaces the leading zero as digits are entered', () => {
    const afterSeven = reduce(createInitialState(), { type: 'digit', digit: '7' }, operations)
    const afterEight = reduce(afterSeven.state, { type: 'digit', digit: '8' }, operations)

    expect(afterSeven.state.input).toBe('7')
    expect(afterSeven.state.clearLabel).toBe('C')
    expect(afterEight.state.input).toBe('78')
  })

  it('builds a decimal number and ignores a second decimal point', () => {
    const typed = reduce(createInitialState(), { type: 'digit', digit: '3' }, operations)
    const withPoint = reduce(typed.state, { type: 'decimal' }, operations)
    const withFraction = reduce(withPoint.state, { type: 'digit', digit: '5' }, operations)
    const ignoredPoint = reduce(withFraction.state, { type: 'decimal' }, operations)

    expect(withPoint.state.input).toBe('3.')
    expect(withFraction.state.input).toBe('3.5')
    expect(ignoredPoint.state.input).toBe('3.5')
  })

  it('toggles the sign of the current entry', () => {
    const typed = reduce(createInitialState(), { type: 'digit', digit: '5' }, operations)
    const negated = reduce(typed.state, { type: 'sign' }, operations)
    const restored = reduce(negated.state, { type: 'sign' }, operations)

    expect(negated.state.input).toBe('-5')
    expect(restored.state.input).toBe('5')
  })

  it('uses C to clear the current entry and AC to reset the pending operation', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '8' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    ;({ state } = reduce(state, { type: 'digit', digit: '2' }, operations))

    const clearedEntry = reduce(state, { type: 'clear' }, operations)
    expect(clearedEntry.state.input).toBe('0')
    expect(clearedEntry.state.pendingOperationId).toBe('add')
    expect(clearedEntry.state.clearLabel).toBe('AC')

    const allClear = reduce(clearedEntry.state, { type: 'clear' }, operations)
    expect(allClear.state.pendingOperationId).toBeNull()
    expect(allClear.state.leftOperand).toBeNull()
    expect(allClear.state.expression).toBe('')
  })

  it('analyzes a completed binary expression when equals is pressed', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '2' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    expect(state.expression).toBe('2 +')
    expect(state.pendingOperationId).toBe('add')

    ;({ state } = reduce(state, { type: 'digit', digit: '3' }, operations))
    const equals = reduce(state, { type: 'equals' }, operations)

    expect(equals.effect).toEqual({
      type: 'calculate',
      analyzed: {
        operation: 'add',
        operands: [2, 3],
        expression: '2 + 3',
        analysis: 'Addition of 2 and 3',
      },
      recordHistory: true,
      queuedOperationId: null,
    })
  })

  it('evaluates the pending expression when a new binary operator is chained', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '2' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    ;({ state } = reduce(state, { type: 'digit', digit: '3' }, operations))
    const chained = reduce(state, { type: 'operation', operationId: 'multiply' }, operations)

    expect(chained.effect).toMatchObject({
      type: 'calculate',
      analyzed: { operation: 'add', operands: [2, 3] },
      recordHistory: false,
      queuedOperationId: 'multiply',
    })
  })

  it('applies unary operations to the current value immediately', () => {
    const typed = reduce(createInitialState(), { type: 'digit', digit: '9' }, operations)
    const sqrt = reduce(typed.state, { type: 'operation', operationId: 'sqrt' }, operations)

    expect(sqrt.effect).toMatchObject({
      type: 'calculate',
      analyzed: {
        operation: 'sqrt',
        operands: [9],
        expression: '√(9)',
      },
      recordHistory: true,
    })
  })

  it('writes a successful result into the display and queues the next operator', () => {
    const afterEquals = reduce(
      {
        ...createInitialState(),
        input: '3',
        leftOperand: 2,
        pendingOperationId: 'add',
      },
      {
        type: 'succeed',
        result: 5,
        analyzed: {
          operation: 'add',
          operands: [2, 3],
          expression: '2 + 3',
          analysis: 'Addition of 2 and 3',
        },
        recordHistory: false,
        queuedOperationId: 'multiply',
      },
      operations,
    )

    expect(afterEquals.state.input).toBe('5')
    expect(afterEquals.state.leftOperand).toBe(5)
    expect(afterEquals.state.pendingOperationId).toBe('multiply')
    expect(afterEquals.state.expression).toBe('5 ×')
    expect(afterEquals.state.overwrite).toBe(true)
  })

  it('repeats the last binary operation when equals is pressed again', () => {
    const afterFirstResult = reduce(
      createInitialState(),
      {
        type: 'succeed',
        result: 5,
        analyzed: {
          operation: 'add',
          operands: [2, 3],
          expression: '2 + 3',
          analysis: 'Addition of 2 and 3',
        },
        recordHistory: true,
        queuedOperationId: null,
      },
      operations,
    )

    const repeated = reduce(afterFirstResult.state, { type: 'equals' }, operations)
    expect(repeated.effect).toMatchObject({
      analyzed: { operation: 'add', operands: [5, 3] },
      recordHistory: true,
    })
  })

  it('surfaces a calculation error on the display', () => {
    const failed = reduce(createInitialState(), { type: 'fail', message: 'Cannot divide by zero.' }, operations)

    expect(failed.state.input).toBe('Error')
    expect(failed.state.error).toBe('Cannot divide by zero.')
    expect(failed.state.pendingOperationId).toBeNull()
  })
})
