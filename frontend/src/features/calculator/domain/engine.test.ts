import { describe, expect, it } from 'vitest'

import { createInitialState, currentValue, pendingOperationId, reduce } from './engine'
import type { Operation } from './types'

const operations: Operation[] = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'multiply', label: 'Multiplication', arity: 2, symbol: '×' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
  { id: 'percentage', label: 'Percentage', arity: 1, symbol: '%' },
]

describe('calculator engine', () => {
  it('treats an error display as a non-numeric current value', () => {
    expect(currentValue(createInitialState())).toBe(0)
    expect(currentValue({ ...createInitialState(), input: 'Error' })).toBeNaN()
  })

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
    expect(pendingOperationId(clearedEntry.state)).toBe('add')
    expect(clearedEntry.state.clearLabel).toBe('AC')

    const allClear = reduce(clearedEntry.state, { type: 'clear' }, operations)
    expect(pendingOperationId(allClear.state)).toBeNull()
    expect(allClear.state.operands).toEqual([])
    expect(allClear.state.expression).toBe('')
  })

  it('analyzes a completed binary expression when equals is pressed', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '2' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    expect(state.expression).toBe('2 +')
    expect(pendingOperationId(state)).toBe('add')

    ;({ state } = reduce(state, { type: 'digit', digit: '3' }, operations))
    const equals = reduce(state, { type: 'equals' }, operations)

    expect(equals.effect).toEqual({
      type: 'calculate',
      analyzed: {
        kind: 'chain',
        operands: [2, 3],
        operations: ['add'],
        expression: '2 + 3',
        analysis: 'Addition of 2 and 3',
      },
      recordHistory: true,
    })
  })

  it('extends a binary operator chain without evaluating intermediate pairs', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '1' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    ;({ state } = reduce(state, { type: 'digit', digit: '2' }, operations))
    const chained = reduce(state, { type: 'operation', operationId: 'multiply' }, operations)

    expect(chained.effect).toBeUndefined()
    expect(chained.state.expression).toBe('1 + 2 ×')
    expect(chained.state.operands).toEqual([1, 2])
    expect(chained.state.operators).toEqual(['add', 'multiply'])

    ;({ state } = reduce(chained.state, { type: 'digit', digit: '3' }, operations))
    const equals = reduce(state, { type: 'equals' }, operations)

    expect(equals.effect).toMatchObject({
      analyzed: {
        kind: 'chain',
        operands: [1, 2, 3],
        operations: ['add', 'multiply'],
        expression: '1 + 2 × 3',
      },
      recordHistory: true,
    })
  })

  it('replaces the last operator when another operator is pressed before a new number', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '4' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    const replaced = reduce(state, { type: 'operation', operationId: 'multiply' }, operations)

    expect(replaced.effect).toBeUndefined()
    expect(replaced.state.expression).toBe('4 ×')
    expect(replaced.state.operators).toEqual(['multiply'])
  })

  it('applies unary operations to the current value immediately', () => {
    const typed = reduce(createInitialState(), { type: 'digit', digit: '9' }, operations)
    const sqrt = reduce(typed.state, { type: 'operation', operationId: 'sqrt' }, operations)

    expect(sqrt.effect).toMatchObject({
      type: 'calculate',
      analyzed: {
        kind: 'unary',
        operation: 'sqrt',
        operands: [9],
        expression: '√(9)',
      },
      recordHistory: true,
    })
  })

  it('keeps an open expression when a unary operation is applied to the current term', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '1' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    ;({ state } = reduce(state, { type: 'digit', digit: '9' }, operations))
    const sqrt = reduce(state, { type: 'operation', operationId: 'sqrt' }, operations)

    expect(sqrt.effect).toMatchObject({
      analyzed: { kind: 'unary', operation: 'sqrt', operands: [9] },
      recordHistory: false,
    })

    const afterSqrt = reduce(
      sqrt.state,
      {
        type: 'succeed',
        result: 3,
        analyzed: {
          kind: 'unary',
          operation: 'sqrt',
          operands: [9],
          expression: '√(9)',
          analysis: 'Square root of 9',
        },
        recordHistory: false,
      },
      operations,
    )

    expect(afterSqrt.state.input).toBe('3')
    expect(afterSqrt.state.operands).toEqual([1])
    expect(afterSqrt.state.operators).toEqual(['add'])
    expect(afterSqrt.state.expression).toBe('1 +')
  })

  it('writes a successful chain result into the display', () => {
    const afterEquals = reduce(
      {
        ...createInitialState(),
        input: '3',
        operands: [1, 2],
        operators: ['add', 'multiply'],
      },
      {
        type: 'succeed',
        result: 7,
        analyzed: {
          kind: 'chain',
          operands: [1, 2, 3],
          operations: ['add', 'multiply'],
          expression: '1 + 2 × 3',
          analysis: '',
        },
        recordHistory: true,
      },
      operations,
    )

    expect(afterEquals.state.input).toBe('7')
    expect(afterEquals.state.operands).toEqual([])
    expect(afterEquals.state.operators).toEqual([])
    expect(afterEquals.state.expression).toBe('1 + 2 × 3')
    expect(afterEquals.state.overwrite).toBe(true)
  })

  it('repeats the last binary operation when equals is pressed again', () => {
    const afterFirstResult = reduce(
      createInitialState(),
      {
        type: 'succeed',
        result: 5,
        analyzed: {
          kind: 'chain',
          operands: [2, 3],
          operations: ['add'],
          expression: '2 + 3',
          analysis: 'Addition of 2 and 3',
        },
        recordHistory: true,
      },
      operations,
    )

    const repeated = reduce(afterFirstResult.state, { type: 'equals' }, operations)
    expect(repeated.effect).toMatchObject({
      analyzed: { kind: 'chain', operands: [5, 3], operations: ['add'] },
      recordHistory: true,
    })
  })

  it('surfaces a calculation error on the display', () => {
    const failed = reduce(createInitialState(), { type: 'fail', message: 'Cannot divide by zero.' }, operations)

    expect(failed.state.input).toBe('Error')
    expect(failed.state.error).toBe('Cannot divide by zero.')
    expect(pendingOperationId(failed.state)).toBeNull()
  })

  it('replaces a leading zero, including negative zero, with the next digit', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '1' }, operations)
    ;({ state } = reduce(state, { type: 'backspace' }, operations))
    const negativeZero = reduce(state, { type: 'sign' }, operations)
    expect(negativeZero.state.input).toBe('-0')

    const replaced = reduce(negativeZero.state, { type: 'digit', digit: '4' }, operations)
    expect(replaced.state.input).toBe('-4')
  })

  it('starts a decimal from overwrite and keeps an open expression', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '6' }, operations)
    ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    const decimal = reduce(state, { type: 'decimal' }, operations)

    expect(decimal.state.input).toBe('0.')
    expect(decimal.state.operands).toEqual([6])
    expect(decimal.state.expression).toBe('6 +')
  })

  it('backspaces the current entry and ignores backspace after overwrite', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '1' }, operations)
    ;({ state } = reduce(state, { type: 'digit', digit: '2' }, operations))
    const trimmed = reduce(state, { type: 'backspace' }, operations)
    expect(trimmed.state.input).toBe('1')

    const toZero = reduce(trimmed.state, { type: 'backspace' }, operations)
    expect(toZero.state.input).toBe('0')
    expect(toZero.state.clearLabel).toBe('AC')

    ;({ state } = reduce(createInitialState(), { type: 'operation', operationId: 'add' }, operations))
    const ignored = reduce(state, { type: 'backspace' }, operations)
    expect(ignored.state.input).toBe('0')
  })

  it('caps digit entry at nine digits', () => {
    let { state } = reduce(createInitialState(), { type: 'digit', digit: '1' }, operations)
    for (let index = 0; index < 8; index += 1) {
      ;({ state } = reduce(state, { type: 'digit', digit: '0' }, operations))
    }
    const extra = reduce(state, { type: 'digit', digit: '9' }, operations)
    expect(extra.state.input).toBe('100000000')
  })

  it('ignores unknown, unsupported-arity, and error-state operations', () => {
    const unknown = reduce(createInitialState(), { type: 'operation', operationId: 'modulo' }, operations)
    expect(unknown.state).toEqual(createInitialState())

    const ternary = reduce(
      createInitialState(),
      { type: 'operation', operationId: 'add' },
      [{ id: 'add', label: 'Add', arity: 3, symbol: '+' }],
    )
    expect(ternary.effect).toBeUndefined()
    expect(ternary.state.operators).toEqual([])

    const failed = reduce(createInitialState(), { type: 'fail', message: 'boom' }, operations)
    expect(reduce(failed.state, { type: 'operation', operationId: 'add' }, operations).effect).toBeUndefined()
    expect(reduce(failed.state, { type: 'equals' }, operations).effect).toBeUndefined()
    expect(reduce(failed.state, { type: 'sign' }, operations).state.input).toBe('Error')
    expect(reduce(failed.state, { type: 'backspace' }, operations).state.input).toBe('Error')
  })

  it('rejects chaining past the expression operand limit', () => {
    let state = createInitialState()
    for (let index = 0; index < 15; index += 1) {
      ;({ state } = reduce(state, { type: 'digit', digit: '1' }, operations))
      ;({ state } = reduce(state, { type: 'operation', operationId: 'add' }, operations))
    }
    ;({ state } = reduce(state, { type: 'digit', digit: '1' }, operations))
    const overflow = reduce(state, { type: 'operation', operationId: 'add' }, operations)

    expect(overflow.state.input).toBe('Error')
    expect(overflow.state.error).toBe('An expression must contain between 2 and 16 operands.')
  })

  it('does nothing on equals when there is no pending expression or last binary', () => {
    const idle = reduce(createInitialState(), { type: 'equals' }, operations)
    expect(idle.effect).toBeUndefined()
    expect(idle.state.input).toBe('0')
  })

  it('recalls a value onto a fresh state', () => {
    const recalled = reduce(createInitialState(), { type: 'recall', value: 12.5 }, operations)
    expect(recalled.state.input).toBe('12.5')
    expect(recalled.state.overwrite).toBe(true)
    expect(recalled.state.operands).toEqual([])
  })

  it('writes a standalone unary result into the expression', () => {
    const afterSqrt = reduce(
      { ...createInitialState(), input: '9' },
      {
        type: 'succeed',
        result: 3,
        analyzed: {
          kind: 'unary',
          operation: 'sqrt',
          operands: [9],
          expression: '√(9)',
          analysis: 'Square root of 9',
        },
        recordHistory: true,
      },
      operations,
    )

    expect(afterSqrt.state.input).toBe('3')
    expect(afterSqrt.state.expression).toBe('√(9)')
    expect(afterSqrt.state.operands).toEqual([])
  })

  it('leaves lastBinary empty when a chain result has no trailing operation', () => {
    const after = reduce(
      createInitialState(),
      {
        type: 'succeed',
        result: 1,
        analyzed: {
          kind: 'chain',
          operands: [1],
          operations: [],
          expression: '1',
          analysis: '',
        },
        recordHistory: true,
      },
      operations,
    )

    expect(after.state.lastBinary).toBeNull()
  })
})
