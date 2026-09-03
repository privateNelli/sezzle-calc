import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DESKTOP_MEDIA_QUERY, useDesktopLayout } from './use-desktop-layout'

describe('useDesktopLayout', () => {
  it('follows the desktop media query', () => {
    const media = {
      matches: true,
      media: DESKTOP_MEDIA_QUERY,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }
    vi.stubGlobal(
      'matchMedia',
      (query: string) => (query === DESKTOP_MEDIA_QUERY ? media : { ...media, matches: false }),
    )

    const { result, unmount } = renderHook(() => useDesktopLayout())
    expect(result.current).toBe(true)
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    vi.unstubAllGlobals()
  })

  it('is not desktop when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useDesktopLayout())
    expect(result.current).toBe(false)
    vi.unstubAllGlobals()
  })
})
