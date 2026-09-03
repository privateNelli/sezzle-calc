import { describe, expect, it, vi } from 'vitest'

import { calculate, CalculatorApiError, getOperations } from './api'

describe('calculator API client', () => {
  it('gets the available operations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          operations: [{ id: 'add', label: 'Addition', arity: 2, symbol: '+' }],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getOperations()).resolves.toEqual([
      { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
    ])
  })

  it('posts a calculation and returns its result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ operation: 'add', operands: [4, 5], result: 9 }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(calculate({ operation: 'add', operands: [4, 5] })).resolves.toEqual({
      operation: 'add',
      operands: [4, 5],
      result: 9,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('surfaces a structured backend error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: 'DIVISION_BY_ZERO', message: 'Cannot divide by zero.' },
          }),
          { status: 422 },
        ),
      ),
    )

    await expect(calculate({ operation: 'divide', operands: [1, 0] })).rejects.toEqual(
      new CalculatorApiError('DIVISION_BY_ZERO', 'Cannot divide by zero.'),
    )
  })
})
