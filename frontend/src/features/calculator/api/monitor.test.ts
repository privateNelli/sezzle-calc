import { describe, expect, it } from 'vitest'

import {
  beginEndpointCall,
  completeEndpointCall,
  formatEndpointJson,
  formatEndpointTime,
  getEndpointSnapshots,
  resetEndpointMonitor,
  subscribeEndpointSnapshots,
} from './monitor'

describe('endpoint monitor', () => {
  it('lists the API endpoints as idle by default', () => {
    resetEndpointMonitor()
    expect(getEndpointSnapshots().map((snapshot) => snapshot.id)).toEqual([
      'health',
      'operations',
      'calculate',
      'evaluate',
    ])
    expect(getEndpointSnapshots().every((snapshot) => snapshot.phase === 'idle')).toBe(true)
  })

  it('marks an endpoint as calling and then stores the last JSON response', () => {
    resetEndpointMonitor()
    const seen: string[] = []
    const unsubscribe = subscribeEndpointSnapshots(() => {
      seen.push(getEndpointSnapshots().find((snapshot) => snapshot.id === 'evaluate')?.phase ?? '')
    })

    beginEndpointCall('evaluate')
    completeEndpointCall('evaluate', {
      ok: true,
      status: 200,
      body: { result: 7 },
      at: '2026-09-03T21:00:00.000Z',
    })
    unsubscribe()

    const evaluate = getEndpointSnapshots().find((snapshot) => snapshot.id === 'evaluate')
    expect(seen).toEqual(['calling', 'ok'])
    expect(evaluate).toMatchObject({
      phase: 'ok',
      lastStatus: 200,
      lastAt: '2026-09-03T21:00:00.000Z',
      lastBody: { result: 7 },
    })
  })

  it('keeps the previous response while a new call is in flight', () => {
    resetEndpointMonitor()
    completeEndpointCall('calculate', {
      ok: true,
      status: 200,
      body: { result: 3 },
      at: '2026-09-03T20:00:00.000Z',
    })
    beginEndpointCall('calculate')

    expect(getEndpointSnapshots().find((snapshot) => snapshot.id === 'calculate')).toMatchObject({
      phase: 'calling',
      lastBody: { result: 3 },
      lastAt: '2026-09-03T20:00:00.000Z',
    })
  })

  it('formats JSON and timestamps for display', () => {
    expect(formatEndpointJson({ result: 1 })).toBe('{\n  "result": 1\n}')
    expect(formatEndpointTime('2026-09-03T21:00:00.000Z')).toMatch(/^\d{2}\/\d{2}\/2026 \d{2}:\d{2}:\d{2}$/)
  })
})
