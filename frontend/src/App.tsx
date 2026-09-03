import { useEffect, useState } from 'react'

import { CalculatorForm } from './features/calculator/CalculatorForm'
import { getOperations, type Operation } from './features/calculator/api'
import './App.css'

function App() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getOperations()
      .then(setOperations)
      .catch(() => setError('The calculator service is unavailable. Start the backend and try again.'))
  }, [])

  return (
    <main className="page-shell">
      <section className="calculator-card" aria-labelledby="page-title">
        <header>
          <p className="eyebrow">Sezzle Calculator Homework</p>
          <h1 id="page-title">Calculator</h1>
          <p className="intro">Choose an operation, enter your values, and let the Go service do the math.</p>
        </header>

        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : operations.length === 0 ? (
          <p className="message" role="status">
            Loading operations…
          </p>
        ) : (
          <CalculatorForm operations={operations} />
        )}
      </section>
    </main>
  )
}

export default App
