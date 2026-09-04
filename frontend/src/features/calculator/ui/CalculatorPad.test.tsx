import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CalculatorPad } from './CalculatorPad'

const operations = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'divide', label: 'Division', arity: 2, symbol: '÷' },
]

describe('CalculatorPad', () => {
  it('dispatches digit, decimal, sign, clear, equals, and operation keys', async () => {
    const onDispatch = vi.fn()
    const user = userEvent.setup()
    render(
      <CalculatorPad
        operations={operations}
        clearLabel="C"
        activeOperationId="add"
        theme="dark"
        showHistoryToggle
        historyOpen={false}
        onToggleHistory={vi.fn()}
        onToggleTheme={vi.fn()}
        onDispatch={onDispatch}
      />,
    )

    await user.click(screen.getByRole('button', { name: '7' }))
    await user.click(screen.getByRole('button', { name: 'Decimal point' }))
    await user.click(screen.getByRole('button', { name: 'Toggle sign' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))

    expect(onDispatch.mock.calls.map(([action]) => action)).toEqual([
      { type: 'digit', digit: '7' },
      { type: 'decimal' },
      { type: 'sign' },
      { type: 'clear' },
      { type: 'equals' },
      { type: 'operation', operationId: 'add' },
    ])
    expect(screen.getByRole('button', { name: 'Addition' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('puts history and theme on their own row when the last keypad row is full', () => {
    render(
      <CalculatorPad
        operations={operations}
        clearLabel="AC"
        activeOperationId={null}
        theme="light"
        showHistoryToggle
        historyOpen
        onToggleHistory={vi.fn()}
        onToggleTheme={vi.fn()}
        onDispatch={vi.fn()}
      />,
    )

    const history = screen.getByRole('button', { name: 'History' })
    const theme = screen.getByRole('button', { name: 'Switch to dark mode' })
    expect(history).toHaveAttribute('aria-expanded', 'true')
    expect(history.closest('.pad-row')).toBe(theme.closest('.pad-row'))
    expect(history.closest('.pad-row')?.querySelectorAll('.key')).toHaveLength(2)
  })

  it('hides the history toggle when the panel is always visible', () => {
    render(
      <CalculatorPad
        operations={operations}
        clearLabel="AC"
        activeOperationId={null}
        theme="light"
        showHistoryToggle={false}
        historyOpen={false}
        onToggleHistory={vi.fn()}
        onToggleTheme={vi.fn()}
        onDispatch={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'History' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })
})
