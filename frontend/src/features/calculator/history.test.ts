import { describe, expect, it } from 'vitest'

import { addHistoryEntry, parseHistory, serializeHistory, type HistoryEntry } from './history'

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'entry-1',
    expression: '2 + 3',
    analysis: 'Addition of 2 and 3',
    result: 5,
    createdAt: '2026-09-03T12:00:00.000Z',
    ...overrides,
  }
}

describe('history', () => {
  it('prepends a new entry and caps the list', () => {
    const first = addHistoryEntry([], {
      expression: '1 + 1',
      analysis: 'Addition of 1 and 1',
      result: 2,
    }, 2)
    const second = addHistoryEntry(first, {
      expression: '4 × 5',
      analysis: 'Multiplication of 4 and 5',
      result: 20,
    }, 2)
    const third = addHistoryEntry(second, {
      expression: '9 − 3',
      analysis: 'Subtraction of 9 and 3',
      result: 6,
    }, 2)

    expect(third).toHaveLength(2)
    expect(third[0]?.expression).toBe('9 − 3')
    expect(third[1]?.expression).toBe('4 × 5')
    expect(third[0]?.id).toBeTruthy()
    expect(third[0]?.createdAt).toBeTruthy()
  })

  it('round-trips valid history JSON and ignores corrupt payloads', () => {
    const stored = [entry()]
    expect(parseHistory(serializeHistory(stored))).toEqual(stored)
    expect(parseHistory(null)).toEqual([])
    expect(parseHistory('{not json')).toEqual([])
    expect(parseHistory(JSON.stringify([{ expression: 'broken' }]))).toEqual([])
  })
})
