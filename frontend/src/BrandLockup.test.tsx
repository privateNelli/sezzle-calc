import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BrandLockup } from './BrandLockup'

describe('BrandLockup', () => {
  it('renders the desktop heading and tagline', () => {
    render(<BrandLockup />)

    expect(screen.getByRole('heading', { level: 1, name: "Let's do Mathematics." })).toBeInTheDocument()
    expect(screen.getByText('Do your thing')).toBeInTheDocument()
  })
})
