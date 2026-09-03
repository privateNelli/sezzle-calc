import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CalculatorDisplay } from './CalculatorDisplay'

describe('CalculatorDisplay', () => {
  it('shows analysis only when it adds information beyond the expression', () => {
    const { rerender } = render(
      <CalculatorDisplay expression="2 + 3" value="5" analysis="Addition of 2 and 3" error={null} />,
    )
    expect(screen.getByTestId('calculator-analysis')).toHaveTextContent('Addition of 2 and 3')

    rerender(<CalculatorDisplay expression="1 + 2 × 3" value="7" analysis="1 + 2 × 3" error={null} />)
    expect(screen.getByTestId('calculator-analysis')).toHaveTextContent('')
  })

  it('replaces analysis with an alert when a calculation fails', () => {
    render(
      <CalculatorDisplay expression="" value="Error" analysis={null} error="Cannot divide by zero." />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Cannot divide by zero.')
    expect(screen.queryByTestId('calculator-analysis')).not.toBeInTheDocument()
  })

  it('shrinks the value as more digits appear', () => {
    const { rerender } = render(
      <CalculatorDisplay expression="" value="12" analysis={null} error={null} />,
    )
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-lg')

    rerender(<CalculatorDisplay expression="" value="123456" analysis={null} error={null} />)
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-md')

    rerender(<CalculatorDisplay expression="" value="12345678" analysis={null} error={null} />)
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-sm')

    rerender(<CalculatorDisplay expression="" value="1234567890" analysis={null} error={null} />)
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-xs')
  })
})
