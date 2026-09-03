import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { calculate, evaluate } from '../api/client'
import { HISTORY_STORAGE_KEY } from '../domain/history'
import { useCalculator } from './use-calculator'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return { ...actual, calculate: vi.fn(), evaluate: vi.fn() }
})

const operations = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
]

describe('useCalculator', () => {
  beforeEach(() => {
    vi.mocked(calculate).mockReset()
    vi.mocked(evaluate).mockReset()
    window.localStorage.clear()
  })

  it('evaluates a binary chain and stores history', async () => {
    vi.mocked(evaluate).mockResolvedValue({ operands: [2, 3], operations: ['add'], result: 5 })
    const { result } = renderHook(() => useCalculator(operations))

    await act(async () => {
      await result.current.dispatch({ type: 'digit', digit: '2' })
      await result.current.dispatch({ type: 'operation', operationId: 'add' })
      await result.current.dispatch({ type: 'digit', digit: '3' })
      await result.current.dispatch({ type: 'equals' })
    })

    await waitFor(() => expect(result.current.input).toBe('5'))
    expect(evaluate).toHaveBeenCalledWith({ operands: [2, 3], operations: ['add'] })
    expect(result.current.history[0]?.expression).toBe('2 + 3')
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toContain('2 + 3')
  })

  it('sends unary work to calculate and does not record mid-expression unaries', async () => {
    vi.mocked(calculate).mockResolvedValue({ operation: 'sqrt', operands: [9], result: 3 })
    const { result } = renderHook(() => useCalculator(operations))

    await act(async () => {
      await result.current.dispatch({ type: 'digit', digit: '1' })
      await result.current.dispatch({ type: 'operation', operationId: 'add' })
      await result.current.dispatch({ type: 'digit', digit: '9' })
      await result.current.dispatch({ type: 'operation', operationId: 'sqrt' })
    })

    await waitFor(() => expect(result.current.input).toBe('3'))
    expect(calculate).toHaveBeenCalledWith({ operation: 'sqrt', operands: [9] })
    expect(result.current.history).toEqual([])
    expect(result.current.expression).toBe('1 +')
  })

  it('ignores further keypad actions while a request is in flight', async () => {
    let resolveEvaluate: (value: { operands: number[]; operations: string[]; result: number }) => void =
      () => undefined
    vi.mocked(evaluate).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEvaluate = resolve
        }),
    )
    const { result } = renderHook(() => useCalculator(operations))

    await act(async () => {
      await result.current.dispatch({ type: 'digit', digit: '2' })
      await result.current.dispatch({ type: 'operation', operationId: 'add' })
      await result.current.dispatch({ type: 'digit', digit: '3' })
      void result.current.dispatch({ type: 'equals' })
    })

    await waitFor(() => expect(result.current.isCalculating).toBe(true))

    await act(async () => {
      await result.current.dispatch({ type: 'digit', digit: '9' })
    })
    expect(result.current.input).toBe('3')

    await act(async () => {
      resolveEvaluate({ operands: [2, 3], operations: ['add'], result: 5 })
    })
    await waitFor(() => expect(result.current.input).toBe('5'))
  })

  it('maps non-Error failures to a generic message', async () => {
    vi.mocked(evaluate).mockRejectedValue('boom')
    const { result } = renderHook(() => useCalculator(operations))

    await act(async () => {
      await result.current.dispatch({ type: 'digit', digit: '2' })
      await result.current.dispatch({ type: 'operation', operationId: 'add' })
      await result.current.dispatch({ type: 'digit', digit: '3' })
      await result.current.dispatch({ type: 'equals' })
    })

    await waitFor(() => expect(result.current.error).toBe('Unable to complete the calculation.'))
    expect(result.current.input).toBe('Error')
  })

  it('recalls a value and can clear persisted history', async () => {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'entry-1',
          expression: '1 + 1',
          analysis: 'Addition of 1 and 1',
          result: 2,
          createdAt: '2026-09-03T12:00:00.000Z',
        },
      ]),
    )
    const { result } = renderHook(() => useCalculator(operations))
    expect(result.current.history).toHaveLength(1)

    await act(async () => {
      result.current.recall(8)
    })
    expect(result.current.input).toBe('8')

    act(() => {
      result.current.clearHistory()
    })
    expect(result.current.history).toEqual([])
  })
})
