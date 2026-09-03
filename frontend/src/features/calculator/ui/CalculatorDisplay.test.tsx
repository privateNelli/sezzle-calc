import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CalculatorDisplay } from './CalculatorDisplay'

describe('CalculatorDisplay', () => {
  it('does not show a prose analysis under the result', () => {
    render(<CalculatorDisplay expression="2 + 3" value="5" error={null} />)

    expect(screen.queryByText('Addition of 2 and 3')).not.toBeInTheDocument()
    expect(screen.queryByTestId('calculator-analysis')).not.toBeInTheDocument()
  })

  it('shows an alert when a calculation fails', () => {
    render(<CalculatorDisplay expression="" value="Error" error="Cannot divide by zero." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Cannot divide by zero.')
  })

  it('shrinks the value as more digits appear', () => {
    const { rerender } = render(<CalculatorDisplay expression="" value="12" error={null} />)
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-lg')

    rerender(<CalculatorDisplay expression="" value="123456" error={null} />)
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-md')

    rerender(<CalculatorDisplay expression="" value="12345678" error={null} />)
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-sm')

    rerender(<CalculatorDisplay expression="" value="1234567890" error={null} />)
    expect(screen.getByTestId('calculator-display')).toHaveClass('calculator-value-xs')
  })
})
