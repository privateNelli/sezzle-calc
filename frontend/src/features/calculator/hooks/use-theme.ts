import { useLayoutEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'sezzle-calculator-theme'

export type Theme = 'light' | 'dark'

export function parseTheme(raw: string | null): Theme {
  return raw === 'light' ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY)))

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
