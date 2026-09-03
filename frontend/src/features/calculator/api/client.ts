import type { Operation } from '../domain/types'

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

export async function getOperations(): Promise<Operation[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/operations`)
  const body = await parseResponse<{ operations: Operation[] }>(response)
  return body.operations
}

export async function calculate(input: CalculationInput): Promise<Calculation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return parseResponse<Calculation>(response)
}

export async function evaluate(input: EvaluateInput): Promise<Evaluation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return parseResponse<Evaluation>(response)
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorResponse

  if (!response.ok) {
    const error = body as ApiErrorResponse
    throw new CalculatorApiError(error.error.code, error.error.message)
  }

  return body as T
}
