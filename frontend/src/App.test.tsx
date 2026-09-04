import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { getHealth, getOperations } from './features/calculator'

vi.mock('./features/calculator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./features/calculator')>()
  return { ...actual, getHealth: vi.fn(), getOperations: vi.fn() }
})

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getHealth).mockReset()
    vi.mocked(getOperations).mockReset()
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok' })
  })

  it('shows a loading status until the catalog arrives', () => {
    vi.mocked(getOperations).mockReturnValue(new Promise(() => undefined))
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading operations…')
    expect(getHealth).toHaveBeenCalledTimes(1)
  })

  it('shows an alert when the catalog cannot be loaded', async () => {
    vi.mocked(getOperations).mockRejectedValue(new Error('offline'))
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The calculator service is unavailable. Start the backend and try again.',
    )
    expect(getHealth).toHaveBeenCalledTimes(1)
  })

  it('still renders the calculator when the health probe fails', async () => {
    vi.mocked(getHealth).mockRejectedValue(new Error('offline'))
    vi.mocked(getOperations).mockResolvedValue([
      { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
    ])
    render(<App />)
    expect(await screen.findByRole('region', { name: 'Calculator' })).toBeInTheDocument()
  })

  it('renders the calculator once operations are available', async () => {
    vi.mocked(getOperations).mockResolvedValue([
      { id: 'add', label: 'Addition', arity: 2, symbol: '+' },
    ])
    render(<App />)
    expect(await screen.findByRole('region', { name: 'Calculator' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: "Let's do Mathematics." })).toBeInTheDocument()
  })
})
