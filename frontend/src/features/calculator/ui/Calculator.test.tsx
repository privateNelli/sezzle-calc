import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { calculate, evaluate } from '../api/client'
import { HISTORY_STORAGE_KEY } from '../domain/history'
import { Calculator } from './Calculator'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return { ...actual, calculate: vi.fn(), evaluate: vi.fn() }
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
    vi.mocked(evaluate).mockReset()
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.unstubAllGlobals()
  })

  it('analyzes a keypad expression and shows the API result', async () => {
    vi.mocked(evaluate).mockResolvedValue({
      operands: [2, 3],
      operations: ['add'],
      result: 5,
    })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))

    expect(evaluate).toHaveBeenCalledWith({ operands: [2, 3], operations: ['add'] })
    expect(await screen.findByTestId('calculator-display')).toHaveTextContent('5')
    expect(screen.queryByText('Addition of 2 and 3')).not.toBeInTheDocument()
  })

  it('evaluates a multi-step expression with operator precedence', async () => {
    vi.mocked(evaluate).mockResolvedValue({
      operands: [1, 2, 3],
      operations: ['add', 'multiply'],
      result: 7,
    })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Multiplication' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))

    expect(evaluate).toHaveBeenCalledTimes(1)
    expect(evaluate).toHaveBeenCalledWith({
      operands: [1, 2, 3],
      operations: ['add', 'multiply'],
    })
    expect(await screen.findByText('1 + 2 × 3')).toBeInTheDocument()
    expect(screen.getAllByText('1 + 2 × 3')).toHaveLength(1)
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('7')
  })

  it('does not repeat the expression under the history result', async () => {
    vi.mocked(evaluate).mockResolvedValue({
      operands: [55, 2, 10],
      operations: ['multiply', 'add'],
      result: 120,
    })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'Multiplication' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))
    await user.click(screen.getByRole('button', { name: 'History' }))

    const history = await screen.findByRole('list', { name: 'Calculation history' })
    expect(within(history).getByText('55 × 2 + 10')).toBeInTheDocument()
    expect(within(history).getByText('= 120')).toBeInTheDocument()
    expect(within(history).getAllByText('55 × 2 + 10')).toHaveLength(1)
  })

  it('places the API status module under history on desktop and in an accordion on mobile', () => {
    stubDesktopLayout(true)
    const { unmount } = render(<Calculator operations={operations} />)

    const historyPanel = screen.getByRole('complementary', { name: 'History' })
    expect(within(historyPanel).getByRole('heading', { name: 'API' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'API endpoints' })).not.toBeInTheDocument()
    unmount()

    stubDesktopLayout(false)
    render(<Calculator operations={operations} />)
    expect(screen.getByRole('button', { name: 'API endpoints' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('heading', { name: 'API' })).not.toBeInTheDocument()
  })

  it('keeps history visible on desktop without a sheet or keypad toggle', async () => {
    stubDesktopLayout(true)
    vi.mocked(evaluate).mockResolvedValue({ operands: [2, 3], operations: ['add'], result: 5 })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    const historyPanel = screen.getByRole('complementary', { name: 'History' })
    expect(screen.queryByRole('dialog', { name: 'History' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'History' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
    expect(within(historyPanel).getByRole('status')).toHaveTextContent('No calculations yet.')

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Addition' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))

    const history = await within(historyPanel).findByRole('list', { name: 'Calculation history' })
    expect(within(history).getByText('2 + 3')).toBeInTheDocument()
    expect(within(history).getByText('= 5')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('complementary', { name: 'History' })).toBeInTheDocument()
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0')

    await user.click(within(history).getByRole('button', { name: 'Recall 2 + 3 = 5' }))
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('5')
    expect(screen.getByRole('complementary', { name: 'History' })).toBeInTheDocument()
  })

  it('records a successful calculation in history and recalls the result', async () => {
    vi.mocked(evaluate).mockResolvedValue({ operands: [2, 3], operations: ['add'], result: 5 })
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
    vi.mocked(evaluate).mockRejectedValue(new Error('Cannot divide by zero.'))
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: '8' }))
    await user.click(screen.getByRole('button', { name: 'Division' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot divide by zero.')
  })

  it('persists history between mounts', async () => {
    vi.mocked(evaluate).mockResolvedValue({ operands: [1, 1], operations: ['add'], result: 2 })
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

  it('toggles history closed from the same keypad button', async () => {
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    const historyButton = screen.getByRole('button', { name: 'History' })
    expect(historyButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(historyButton)
    expect(screen.getByRole('dialog', { name: 'History' })).toBeInTheDocument()
    expect(historyButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(historyButton)
    expect(screen.queryByRole('dialog', { name: 'History' })).not.toBeInTheDocument()
    expect(historyButton).toHaveAttribute('aria-expanded', 'false')
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

  it('lets the calculator keep taking input with history visible on desktop', async () => {
    stubDesktopLayout(true)
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    expect(screen.getByRole('complementary', { name: 'History' })).toBeInTheDocument()

    await user.keyboard('7')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('7')

    await user.click(screen.getByRole('button', { name: '8' }))
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('78')
  })

  it('blocks calculator input while the mobile history sheet is open', async () => {
    stubDesktopLayout(false)
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByRole('dialog', { name: 'History' })).toBeInTheDocument()

    await user.keyboard('7')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0')
    expect(screen.getByRole('dialog', { name: 'History' })).toBeInTheDocument()
  })

  it('maps keyboard input to calculator actions', async () => {
    vi.mocked(evaluate).mockResolvedValue({ operands: [2, 3], operations: ['add'], result: 5 })
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.keyboard('2+3{Enter}')
    expect(await screen.findByTestId('calculator-display')).toHaveTextContent('5')

    await user.keyboard('{Escape}')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0')

    await user.keyboard('8.')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('8.')

    await user.keyboard('{Backspace}')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('8')

    await user.keyboard('{Escape}')
    await user.keyboard('2*4')
    expect(screen.getByText('2 ×')).toBeInTheDocument()
    await user.keyboard('{Escape}{Escape}')
    await user.keyboard('9/3')
    expect(screen.getByText('9 ÷')).toBeInTheDocument()
    vi.mocked(calculate).mockResolvedValue({ operation: 'percentage', operands: [5], result: 0.05 })
    await user.keyboard('{Escape}{Escape}')
    await user.keyboard('5%')
    expect(calculate).toHaveBeenCalledWith({ operation: 'percentage', operands: [5] })
  })

  it('ignores unmapped keys', async () => {
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)
    await user.keyboard('a')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0')
  })

  it('ignores modified keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.keyboard('{Control>}7{/Control}')
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0')
  })

  it('closes the mobile history sheet with Escape and ignores calculator keys', async () => {
    stubDesktopLayout(false)
    const user = userEvent.setup()
    render(<Calculator operations={operations} />)

    await user.click(screen.getByRole('button', { name: 'History' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'History' })).not.toBeInTheDocument()
  })
})

function stubDesktopLayout(isDesktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: isDesktop && query === '(min-width: 48rem)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }),
  )
}
