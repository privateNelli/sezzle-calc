import { useEffect, useState } from 'react'

import { BrandLockup } from './BrandLockup'
import { Calculator, getHealth, getOperations, type Operation } from './features/calculator'
import './App.css'

function App() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getHealth().catch(() => undefined)
    getOperations()
      .then(setOperations)
      .catch(() => setError('The calculator service is unavailable. Start the backend and try again.'))
  }, [])

  return (
    <main className="page-shell">
      <BrandLockup />
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
