import { type FormEvent, useState } from 'react'

import { calculate, type Operation } from './api'

type CalculatorFormProps = {
  operations: Operation[]
}

export function CalculatorForm({ operations }: CalculatorFormProps) {
  const [operationId, setOperationId] = useState(operations[0]?.id ?? '')
  const operation = operations.find((item) => item.id === operationId) ?? operations[0]
  const [operandInputs, setOperandInputs] = useState<string[]>(() =>
    Array.from({ length: operations[0]?.arity ?? 0 }, () => ''),
  )
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!operation) {
    return <p role="alert">No calculator operations are available.</p>
  }

  function updateOperation(nextOperationId: string) {
    const nextOperation = operations.find((item) => item.id === nextOperationId)
    setOperationId(nextOperationId)
    setOperandInputs((current) =>
      Array.from({ length: nextOperation?.arity ?? 0 }, (_, index) => current[index] ?? ''),
    )
    setResult(null)
    setError(null)
  }

  function updateOperand(index: number, value: string) {
    setOperandInputs((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const operands = operandInputs.map(Number)

    if (
      operandInputs.some((value) => value.trim() === '') ||
      operands.some((value) => !Number.isFinite(value))
    ) {
      setError('Enter a valid number in every field.')
      setResult(null)
      return
    }

    setError(null)
    setResult(null)
    setIsSubmitting(true)

    try {
      const calculation = await calculate({ operation: operation.id, operands })
      setResult(calculation.result)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to complete the calculation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Operation</span>
        <select value={operation.id} onChange={(event) => updateOperation(event.target.value)}>
          {operations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.symbol} {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="operand-grid">
        {operandInputs.map((value, index) => {
          const label = operation.arity === 1 ? 'Value' : index === 0 ? 'First value' : 'Second value'
          return (
            <label className="field" key={`${operation.id}-${index}`}>
              <span>{label}</span>
              <input
                inputMode="decimal"
                aria-label={label}
                value={value}
                onChange={(event) => updateOperand(index, event.target.value)}
                placeholder="0"
              />
            </label>
          )
        })}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Calculating…' : 'Calculate'}
      </button>

      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}

      <output className="result" aria-live="polite">
        {result !== null && (
          <>
            <span>Result</span>
            <strong>{formatNumber(result)}</strong>
          </>
        )}
      </output>
    </form>
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(value)
}
