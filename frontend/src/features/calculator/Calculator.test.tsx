import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { calculate } from './api'
import { Calculator } from './Calculator'
import { HISTORY_STORAGE_KEY } from './history'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, calculate: vi.fn() }
})

const operations = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'subtract', label: 'Subtraction', arity: 2, symbol: '−' },
  { id: 'multiply', label: 'Multiplication', arity: 2, symbol: '×' },
  { id: 'divide', label: 'Division', arity: 2, symbol: '÷' },
  { id: 'power', label: 'Exponentiation', arity: 2, symbol: 'xʸ' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
  { id: 'percentage', label: 'Percentage', arity: 1, symbol: '%' },
]

describe('Calculator', () => {
  beforeEach(() => {
    vi.mocked(calculate).mockReset()
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('analyzes a keypad expression and shows the API result', async () => {
    vi.mocked(calculate).mockResolvedValue({ operation: 'add', operands: [2, 3], result: 5 })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))

    expect(calculate).toHaveBeenCalledWith({ operation: 'add', operands: [2, 3] })
    expect(await screen.findByTestId('calculator-analysis')).toHaveTextContent('Addition of 2 and 3')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('5')
  })

  it('records a successful calculation in history and recalls the result', async () => {
    vi.mocked(calculate).mockResolvedValue({ operation: 'add', operands: [2, 3], result: 5 })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))

    expect(screen.queryByRole('dialog', { name: 'History' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'History' }))

    const sheet = await screen.findByRole('dialog', { name: 'History' })
    const history = within(sheet).getByRole('list', { name: 'Calculation history' })
    expect(within(history).getByText('2 + 3')).toBeInTheDocument()
    expect(within(history).getByText('= 5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All Clear' }))
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0')

    await user.click(within(history).getByRole('button', { name: 'Recall 2 + 3 = 5' }))
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('5')
  })

  it('applies a unary operation from the keypad', async () => {
    vi.mocked(calculate).mockResolvedValue({ operation: 'sqrt', operands: [9], result: 3 })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '9' }))
    await user.click(screen.getByRole('button', { name: 'Square root' }))

    expect(calculate).toHaveBeenCalledWith({ operation: 'sqrt', operands: [9] })
    expect(await screen.findByTestId('calculator-display')).toHaveTextContent('3')
  })

  it('shows an API error returned by the backend', async () => {
    vi.mocked(calculate).mockRejectedValue(new Error('Cannot divide by zero.'))
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '8' }))
    await user.click(screen.getByRole('button', { name: 'Division' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot divide by zero.')
  })

  it('persists history between mounts', async () => {
    vi.mocked(calculate).mockResolvedValue({ operation: 'add', operands: [1, 1], result: 2 })
    const user = userEvent.setup()
    const { unmount } = render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))
    await user.click(screen.getByRole('button', { name: 'History' }))
    const history = await screen.findByRole('list', { name: 'Calculation history' })
    expect(within(history).getByText('1 + 1')).toBeInTheDocument()
    unmount()

    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toContain('1 + 1')

    render(<Calculator operations={operations} />)
    await user.click(screen.getByRole('button', { name: 'History' }))
    expect(
      within(screen.getByRole('list', { name: 'Calculation history' })).getByText('1 + 1'),
    ).toBeInTheDocument()
  })

  it('places history and theme toggles in the remaining keypad slots', () => {
    render(<Calculator operations={operations} />)

    const historyButton = screen.getByRole('button', { name: 'History' })
    const themeButton = screen.getByRole('button', { name: 'Switch to light mode' })

    expect(historyButton.closest('.pad-row')).toBe(themeButton.closest('.pad-row'))
    expect(historyButton.closest('.pad-row')?.querySelectorAll('.key')).toHaveLength(4)
  })

  it('toggles light and dark theme from the keypad', async () => {
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
})
