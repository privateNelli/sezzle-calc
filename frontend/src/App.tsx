import { useEffect, useState } from 'react'

import { Calculator } from './features/calculator/Calculator'
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
      <h1 className="visually-hidden">Calculator</h1>
      {error ? (
        <p className="message error" role="alert">
          {error}
        </p>
      ) : operations.length === 0 ? (
        <p className="message" role="status">
          Loading operations…
        </p>
      ) : (
        <Calculator operations={operations} />
      )}
    </main>
  )
}

export default App
