import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  beginEndpointCall,
  completeEndpointCall,
  formatEndpointJson,
  formatEndpointTime,
  resetEndpointMonitor,
} from '../api/monitor'
import { ApiStatusAccordion } from './ApiStatusAccordion'
import { ApiStatusPanel } from './ApiStatusPanel'

describe('ApiStatusPanel', () => {
  beforeEach(() => {
    resetEndpointMonitor()
  })

  it('shows idle endpoints until a response arrives', () => {
    render(<ApiStatusPanel />)

    expect(screen.getByRole('heading', { name: 'API' })).toBeInTheDocument()
    expect(screen.getByText('GET /health')).toBeInTheDocument()
    expect(screen.getByText('GET /api/v1/operations')).toBeInTheDocument()
    expect(screen.getByText('POST /api/v1/calculate')).toBeInTheDocument()
    expect(screen.getByText('POST /api/v1/evaluate')).toBeInTheDocument()
    expect(screen.getAllByText('Idle')).toHaveLength(4)
  })

  it('shows when an endpoint is being called', () => {
    beginEndpointCall('evaluate')
    render(<ApiStatusPanel />)

    const row = screen.getByRole('listitem', { name: /POST \/api\/v1\/evaluate/ })
    expect(within(row).getByText('Calling…')).toBeInTheDocument()
    expect(row).toHaveAttribute('aria-busy', 'true')
  })

  it('shows the last response time and opens formatted JSON in a dialog', async () => {
    completeEndpointCall('evaluate', {
      ok: true,
      status: 200,
      body: { operands: [1, 2], operations: ['add'], result: 3 },
      at: '2026-09-03T21:00:00.000Z',
    })
    const user = userEvent.setup()
    render(<ApiStatusPanel />)

    const row = screen.getByRole('listitem', { name: /POST \/api\/v1\/evaluate/ })
    expect(within(row).getByText('OK 200')).toBeInTheDocument()
    expect(within(row).getByText(formatEndpointTime('2026-09-03T21:00:00.000Z'))).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: 'View JSON response' }))

    const dialog = await screen.findByRole('dialog', { name: 'POST /api/v1/evaluate' })
    expect(within(dialog).getByText(formatEndpointTime('2026-09-03T21:00:00.000Z'))).toBeInTheDocument()
    expect(within(dialog).getByRole('code')).toHaveTextContent(
      formatEndpointJson({ operands: [1, 2], operations: ['add'], result: 3 }).replace(/\s+/g, ' ').trim(),
    )
    expect(within(dialog).getByRole('code').textContent).toContain('"result": 3')
  })

  it('closes the JSON dialog with Escape', async () => {
    completeEndpointCall('operations', {
      ok: true,
      status: 200,
      body: { operations: [] },
      at: '2026-09-03T21:00:00.000Z',
    })
    const user = userEvent.setup()
    render(<ApiStatusPanel />)

    const row = screen.getByRole('listitem', { name: /GET \/api\/v1\/operations/ })
    await user.click(within(row).getByRole('button', { name: 'View JSON response' }))
    expect(screen.getByRole('dialog', { name: 'GET /api/v1/operations' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'GET /api/v1/operations' })).not.toBeInTheDocument()
  })
})

describe('ApiStatusAccordion', () => {
  beforeEach(() => {
    resetEndpointMonitor()
  })

  it('keeps endpoint details collapsed until expanded', async () => {
    completeEndpointCall('calculate', {
      ok: false,
      status: 422,
      body: { error: { code: 'DIVISION_BY_ZERO', message: 'Cannot divide by zero.' } },
      at: '2026-09-03T21:00:00.000Z',
    })
    const user = userEvent.setup()
    render(<ApiStatusAccordion />)

    const toggle = screen.getByRole('button', { name: 'API endpoints' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('POST /api/v1/calculate')).not.toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const row = screen.getByRole('listitem', { name: /POST \/api\/v1\/calculate/ })
    expect(within(row).getByText('Error 422')).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: 'View JSON response' }))
    expect(await screen.findByRole('dialog', { name: 'POST /api/v1/calculate' })).toBeInTheDocument()
  })
})
