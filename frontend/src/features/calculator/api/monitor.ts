export const API_ENDPOINTS = [
  { id: 'health', method: 'GET', path: '/health' },
  { id: 'operations', method: 'GET', path: '/api/v1/operations' },
  { id: 'calculate', method: 'POST', path: '/api/v1/calculate' },
  { id: 'evaluate', method: 'POST', path: '/api/v1/evaluate' },
] as const

export type EndpointId = (typeof API_ENDPOINTS)[number]['id']

export type EndpointPhase = 'idle' | 'calling' | 'ok' | 'error'

export type EndpointSnapshot = {
  id: EndpointId
  method: string
  path: string
  phase: EndpointPhase
  lastStatus: number | null
  lastAt: string | null
  lastBody: unknown | null
}

export type EndpointCallResult = {
  ok: boolean
  status: number | null
  body: unknown
  at?: string
}

type Listener = () => void

const listeners = new Set<Listener>()

function createIdleSnapshot(definition: (typeof API_ENDPOINTS)[number]): EndpointSnapshot {
  return {
    id: definition.id,
    method: definition.method,
    path: definition.path,
    phase: 'idle',
    lastStatus: null,
    lastAt: null,
    lastBody: null,
  }
}

let snapshots: Record<EndpointId, EndpointSnapshot> = createIdleState()
let snapshotList: EndpointSnapshot[] = listSnapshots()

function createIdleState(): Record<EndpointId, EndpointSnapshot> {
  const next = {} as Record<EndpointId, EndpointSnapshot>
  for (const definition of API_ENDPOINTS) {
    next[definition.id] = createIdleSnapshot(definition)
  }
  return next
}

function listSnapshots(): EndpointSnapshot[] {
  return API_ENDPOINTS.map((definition) => snapshots[definition.id])
}

function emit() {
  snapshotList = listSnapshots()
  for (const listener of listeners) {
    listener()
  }
}

export function getEndpointSnapshots(): EndpointSnapshot[] {
  return snapshotList
}

export function subscribeEndpointSnapshots(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function resetEndpointMonitor() {
  snapshots = createIdleState()
  emit()
}

export function beginEndpointCall(id: EndpointId) {
  snapshots = {
    ...snapshots,
    [id]: {
      ...snapshots[id],
      phase: 'calling',
    },
  }
  emit()
}

export function completeEndpointCall(id: EndpointId, result: EndpointCallResult) {
  snapshots = {
    ...snapshots,
    [id]: {
      ...snapshots[id],
      phase: result.ok ? 'ok' : 'error',
      lastStatus: result.status,
      lastAt: result.at ?? new Date().toISOString(),
      lastBody: result.body,
    },
  }
  emit()
}

export function formatEndpointTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatEndpointJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
