import { describe, expect, it } from 'vitest'

import { buildKeypadRows } from './keypad'
import type { Operation } from './types'

const catalog: Operation[] = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'subtract', label: 'Subtraction', arity: 2, symbol: '−' },
  { id: 'multiply', label: 'Multiplication', arity: 2, symbol: '×' },
  { id: 'divide', label: 'Division', arity: 2, symbol: '÷' },
  { id: 'power', label: 'Exponentiation', arity: 2, symbol: 'xʸ' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
  { id: 'percentage', label: 'Percentage', arity: 1, symbol: '%' },
]

describe('buildKeypadRows', () => {
  it('lays out a standard iOS-style pad from the catalog', () => {
    const rows = buildKeypadRows(catalog, 'AC')
    const ids = rows.map((row) => row.map((key) => key.id))

    expect(ids[0]).toEqual(['clear', 'sign', 'op-percentage', 'op-divide'])
    expect(ids[1]).toEqual(['digit-7', 'digit-8', 'digit-9', 'op-multiply'])
    expect(ids[4]?.[0]).toBe('digit-0')
    expect(rows[4]?.[0]).toMatchObject({ id: 'digit-0', kind: 'digit', wide: true })
    expect(ids.at(-1)).toEqual(['op-sqrt', 'op-power'])
  })

  it('omits missing catalog operations instead of inventing keys', () => {
    const rows = buildKeypadRows(
      catalog.filter((item) => item.id === 'add' || item.id === 'divide'),
      'C',
    )
    const ids = rows.flat().map((key) => key.id)

    expect(ids).toContain('op-add')
    expect(ids).toContain('op-divide')
    expect(ids).not.toContain('op-sqrt')
    expect(ids).not.toContain('op-percentage')
    expect(rows[0]?.[0]).toMatchObject({ kind: 'clear', label: 'C', ariaLabel: 'Clear' })
  })

  it('appends unknown catalog operations on a scientific row', () => {
    const rows = buildKeypadRows(
      [
        ...catalog,
        { id: 'modulo', label: 'Modulo', arity: 2, symbol: 'mod' },
        { id: 'abs', label: 'Absolute value', arity: 1, symbol: '|x|' },
      ],
      'AC',
    )
    const scientific = rows.at(-1) ?? []

    expect(scientific.map((key) => key.id)).toEqual(['op-sqrt', 'op-power', 'op-modulo', 'op-abs'])
    expect(scientific.find((key) => key.id === 'op-modulo')).toMatchObject({ variant: 'accent' })
    expect(scientific.find((key) => key.id === 'op-abs')).toMatchObject({ variant: 'function' })
  })
})
