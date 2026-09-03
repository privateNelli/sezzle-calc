import { useSyncExternalStore } from 'react'

export const DESKTOP_MEDIA_QUERY = '(min-width: 48rem)'

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia?.(DESKTOP_MEDIA_QUERY)
  if (!media) {
    return () => {}
  }

  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function getSnapshot() {
  return Boolean(window.matchMedia?.(DESKTOP_MEDIA_QUERY).matches)
}

function getServerSnapshot() {
  return false
}

export function useDesktopLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
