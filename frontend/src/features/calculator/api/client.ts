import type { Operation } from '../domain/types'
import { beginEndpointCall, completeEndpointCall, type EndpointId } from './monitor'

export type { Operation }

export type CalculationInput = {
  operation: string
  operands: number[]
}

export type Calculation = CalculationInput & {
  result: number
}

export type EvaluateInput = {
  operands: number[]
  operations: string[]
}

export type Evaluation = EvaluateInput & {
  result: number
}

type ApiErrorResponse = {
  error: {
    code: string
    message: string
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export type HealthStatus = {
  status: string
}

export class CalculatorApiError extends Error {
  public readonly code: string

  constructor(
    code: string,
    message: string,
  ) {
    super(message)
    this.name = 'CalculatorApiError'
    this.code = code
  }
}

export async function getHealth(): Promise<HealthStatus> {
  return requestJson<HealthStatus>('health', () => fetch(`${apiBaseUrl}/health`))
}

export async function getOperations(): Promise<Operation[]> {
  const body = await requestJson<{ operations: Operation[] }>('operations', () =>
    fetch(`${apiBaseUrl}/api/v1/operations`),
  )
  return body.operations
}

export async function calculate(input: CalculationInput): Promise<Calculation> {
  return requestJson<Calculation>('calculate', () =>
    fetch(`${apiBaseUrl}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
}

export async function evaluate(input: EvaluateInput): Promise<Evaluation> {
  return requestJson<Evaluation>('evaluate', () =>
    fetch(`${apiBaseUrl}/api/v1/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
}

async function requestJson<T>(id: EndpointId, execute: () => Promise<Response>): Promise<T> {
  beginEndpointCall(id)

  try {
    const response = await execute()
    let body: unknown

    try {
      body = await response.json()
    } catch {
      completeEndpointCall(id, {
        ok: false,
        status: response.status,
        body: { error: { code: 'INVALID_RESPONSE', message: 'Response was not valid JSON.' } },
      })
      throw new CalculatorApiError('INVALID_RESPONSE', 'Response was not valid JSON.')
    }

    completeEndpointCall(id, { ok: response.ok, status: response.status, body })

    if (!response.ok) {
      const error = body as ApiErrorResponse
      throw new CalculatorApiError(error.error.code, error.error.message)
    }

    return body as T
  } catch (error) {
    if (error instanceof CalculatorApiError) {
      throw error
    }

    completeEndpointCall(id, {
      ok: false,
      status: null,
      body: {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      },
    })
    throw error
  }
}
