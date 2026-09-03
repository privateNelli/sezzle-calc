import { describe, expect, it } from 'vitest'

import { formatOperand } from './format'

describe('formatOperand', () => {
  it('keeps small integers and zero as entered', () => {
    expect(formatOperand(0)).toBe('0')
    expect(formatOperand(12)).toBe('12')
    expect(formatOperand(-3)).toBe('-3')
  })

  it('preserves negative zero', () => {
    expect(formatOperand(-0)).toBe('-0')
  })

  it('trims trailing zeros from decimal precision', () => {
    expect(formatOperand(1.25)).toBe('1.25')
    expect(formatOperand(2)).toBe('2')
  })

  it('uses scientific notation for very large and very small magnitudes', () => {
    expect(formatOperand(1e9)).toBe('1.000000e9')
    expect(formatOperand(1e-9)).toBe('1.000000e-9')
  })

  it('keeps integer precision strings without a decimal point', () => {
    expect(formatOperand(123456789)).toBe('123456789')
  })

  it('normalizes scientific output produced by toPrecision', () => {
    expect(formatOperand(1.2e-8)).toMatch(/e-8$/)
  })

  it('reports non-finite values as Error', () => {
    expect(formatOperand(Number.POSITIVE_INFINITY)).toBe('Error')
    expect(formatOperand(Number.NaN)).toBe('Error')
  })
})
