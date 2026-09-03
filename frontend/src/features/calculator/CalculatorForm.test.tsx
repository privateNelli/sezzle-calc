import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { calculate } from './api'
import { CalculatorForm } from './CalculatorForm'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, calculate: vi.fn() }
})

const operations = [
  { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
  { id: 'sqrt', label: 'Square root', arity: 1, symbol: '√' },
]

describe('CalculatorForm', () => {
  beforeEach(() => {
    vi.mocked(calculate).mockReset()
  })

  it('prevents submitting an empty value', async () => {
    const user = userEvent.setup()
    render(<CalculatorForm operations={operations} />)

    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid number in every field.')
    expect(calculate).not.toHaveBeenCalled()
  })

  it('submits values and shows the API result', async () => {
    vi.mocked(calculate).mockResolvedValue({ operation: 'add', operands: [2, 3], result: 5 })
    const user = userEvent.setup()
    render(<CalculatorForm operations={operations} />)

    await user.type(screen.getByLabelText('First value'), '2')
    await user.type(screen.getByLabelText('Second value'), '3')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(calculate).toHaveBeenCalledWith({ operation: 'add', operands: [2, 3] })
    expect(await screen.findByText('5')).toBeInTheDocument()
  })

  it('shows an API error returned by the backend', async () => {
    vi.mocked(calculate).mockRejectedValue(new Error('Cannot divide by zero.'))
    const user = userEvent.setup()
    render(<CalculatorForm operations={operations} />)

    await user.type(screen.getByLabelText('First value'), '2')
    await user.type(screen.getByLabelText('Second value'), '0')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot divide by zero.')
  })
})
