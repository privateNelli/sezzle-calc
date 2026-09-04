import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BrandLockup } from './BrandLockup'

describe('BrandLockup', () => {
  it('renders a borderless Calculator title for small screens', () => {
    render(<BrandLockup />)

    const title = screen.getByRole('heading', { level: 1, name: 'Calculator' })
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('app-title')
  })

  it('renders the desktop heading and tagline', () => {
    render(<BrandLockup />)

    expect(screen.getByRole('heading', { level: 1, name: "Let's do Mathematics.", hidden: true })).toBeInTheDocument()
    expect(screen.getByText('Do your thing')).toBeInTheDocument()
  })
})
