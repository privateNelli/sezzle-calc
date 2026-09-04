import { useState } from 'react'

import { ApiStatusPanel } from './ApiStatusPanel'

export function ApiStatusAccordion() {
  const [open, setOpen] = useState(false)

  return (
    <section className="api-accordion">
      <button
        type="button"
        className="api-accordion-toggle"
        aria-expanded={open}
        aria-controls="api-status-panel"
        onClick={() => setOpen((current) => !current)}
      >
        API endpoints
      </button>
      {open ? <ApiStatusPanel /> : null}
    </section>
  )
}
