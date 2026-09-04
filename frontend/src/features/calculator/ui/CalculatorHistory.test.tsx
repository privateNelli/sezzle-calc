import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CalculatorHistory } from './CalculatorHistory'

const entries = [
  {
    id: 'entry-1',
    expression: '2 + 3',
    analysis: 'Addition of 2 and 3',
    result: 5,
    createdAt: '2026-09-03T12:00:00.000Z',
  },
  {
    id: 'entry-2',
    expression: '1 + 2 × 3',
    analysis: '1 + 2 × 3',
    result: 7,
    createdAt: '2026-09-03T12:01:00.000Z',
  },
]

describe('CalculatorHistory', () => {
  it('shows an empty status when there are no entries', () => {
    render(
      <CalculatorHistory entries={[]} onRecall={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('No calculations yet.')
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('recalls a result without analysis captions and can clear the list', async () => {
    const onRecall = vi.fn()
    const onClear = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <CalculatorHistory
        entries={entries}
        onRecall={onRecall}
        onClear={onClear}
        onClose={onClose}
        autoFocusClose
      />,
    )

    expect(screen.queryByText('Addition of 2 and 3')).not.toBeInTheDocument()
    expect(screen.getByText('2 + 3')).toBeInTheDocument()
    expect(screen.getByText('= 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Recall 2 + 3 = 5' }))
    expect(onRecall).toHaveBeenCalledWith(5)

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onClear).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('omits Done when the panel cannot be closed', () => {
    render(<CalculatorHistory entries={entries} onRecall={vi.fn()} onClear={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })
})
