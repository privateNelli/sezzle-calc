import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HistorySheet } from './HistorySheet'
import { SHEET_DEFAULT_RATIO, SHEET_MAX_RATIO, SHEET_MIN_RATIO } from './sheet-height'

const entries = [
  {
    id: 'entry-1',
    expression: '2 + 3',
    analysis: 'Addition of 2 and 3',
    result: 5,
    createdAt: '2026-09-03T12:00:00.000Z',
  },
]

function sheetStyle(): string {
  return screen.getByRole('dialog', { name: 'History' }).getAttribute('style') ?? ''
}

function heightRatio(): number {
  const match = /--sheet-height:\s*([\d.]+)svh/.exec(sheetStyle())
  return Number(match?.[1] ?? Number.NaN) / 100
}

describe('HistorySheet', () => {
  it('resizes when the handle is dragged and snaps to a taller height', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    render(
      <HistorySheet open entries={entries} onClose={vi.fn()} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    const handle = screen.getByRole('slider', { name: 'History sheet height' })
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 })
    fireEvent.pointerMove(window, { pointerId: 1, clientY: 200 })
    fireEvent.pointerUp(window, { pointerId: 1, clientY: 200 })

    expect(heightRatio()).toBeCloseTo(SHEET_MAX_RATIO)
  })

  it('closes when the handle is dragged below the dismiss threshold', () => {
    const onClose = vi.fn()
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    render(
      <HistorySheet open entries={entries} onClose={onClose} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    const handle = screen.getByRole('slider', { name: 'History sheet height' })
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 })
    fireEvent.pointerMove(window, { pointerId: 1, clientY: 900 })
    fireEvent.pointerUp(window, { pointerId: 1, clientY: 900 })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('expands and collapses from the keyboard', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <HistorySheet open entries={entries} onClose={onClose} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    const handle = screen.getByRole('slider', { name: 'History sheet height' })
    handle.focus()
    expect(heightRatio()).toBeCloseTo(SHEET_DEFAULT_RATIO)

    await user.keyboard('{ArrowUp}')
    expect(heightRatio()).toBeCloseTo(SHEET_MAX_RATIO)

    await user.keyboard('{ArrowDown}')
    expect(heightRatio()).toBeCloseTo(SHEET_DEFAULT_RATIO)

    await user.keyboard('{ArrowDown}')
    expect(heightRatio()).toBeCloseTo(SHEET_MIN_RATIO)

    await user.keyboard('{ArrowDown}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('resets height the next time the sheet opens', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <HistorySheet open entries={entries} onClose={vi.fn()} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    const handle = screen.getByRole('slider', { name: 'History sheet height' })
    handle.focus()
    await user.keyboard('{ArrowUp}')
    expect(heightRatio()).toBeCloseTo(SHEET_MAX_RATIO)

    rerender(
      <HistorySheet open={false} entries={entries} onClose={vi.fn()} onRecall={vi.fn()} onClear={vi.fn()} />,
    )
    rerender(
      <HistorySheet open entries={entries} onClose={vi.fn()} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    expect(heightRatio()).toBeCloseTo(SHEET_DEFAULT_RATIO)
  })

  it('jumps to min and max height with Home and End', async () => {
    const user = userEvent.setup()
    render(
      <HistorySheet open entries={entries} onClose={vi.fn()} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    const handle = screen.getByRole('slider', { name: 'History sheet height' })
    handle.focus()
    await user.keyboard('{Home}')
    expect(heightRatio()).toBeCloseTo(SHEET_MAX_RATIO)

    await user.keyboard('{End}')
    expect(heightRatio()).toBeCloseTo(SHEET_MIN_RATIO)

    await user.keyboard('{ArrowLeft}')
    expect(heightRatio()).toBeCloseTo(SHEET_MIN_RATIO)
  })

  it('closes from the backdrop', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <HistorySheet open entries={entries} onClose={onClose} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Dismiss history' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes from Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <HistorySheet open entries={entries} onClose={onClose} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes after recalling an entry', async () => {
    const onClose = vi.fn()
    const onRecall = vi.fn()
    const user = userEvent.setup()
    render(
      <HistorySheet open entries={entries} onClose={onClose} onRecall={onRecall} onClear={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Recall 2 + 3 = 5' }))
    expect(onRecall).toHaveBeenCalledWith(5)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <HistorySheet open={false} entries={entries} onClose={vi.fn()} onRecall={vi.fn()} onClear={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('ignores pointer events that are not the active drag', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    render(
      <HistorySheet open entries={entries} onClose={vi.fn()} onRecall={vi.fn()} onClear={vi.fn()} />,
    )

    const handle = screen.getByRole('slider', { name: 'History sheet height' })
    fireEvent.pointerDown(handle, { pointerId: 1, button: 2, clientY: 500 })
    expect(handle).not.toHaveClass('is-dragging')

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientY: 500 })
    fireEvent.pointerMove(window, { pointerId: 99, clientY: 100 })
    expect(heightRatio()).toBeCloseTo(SHEET_DEFAULT_RATIO)
  })
})
