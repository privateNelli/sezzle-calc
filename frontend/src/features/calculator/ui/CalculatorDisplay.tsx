type CalculatorDisplayProps = {
  expression: string
  value: string
  error: string | null
}

export function CalculatorDisplay({ expression, value, error }: CalculatorDisplayProps) {
  return (
    <div className="calculator-display">
      <p className="calculator-expression">{expression || '\u00a0'}</p>
      <p
        className={`calculator-value ${valueSizeClass(value)}`}
        data-testid="calculator-display"
        aria-live="polite"
      >
        {value}
      </p>
      {error ? (
        <p className="calculator-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function valueSizeClass(value: string): string {
  if (value.length > 9) {
    return 'calculator-value-xs'
  }
  if (value.length > 7) {
    return 'calculator-value-sm'
  }
  if (value.length > 5) {
    return 'calculator-value-md'
  }
  return 'calculator-value-lg'
}
