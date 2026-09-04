import { useSyncExternalStore } from 'react'

import { getEndpointSnapshots, subscribeEndpointSnapshots } from '../api/monitor'

export function useApiMonitor() {
  return useSyncExternalStore(subscribeEndpointSnapshots, getEndpointSnapshots, getEndpointSnapshots)
}
