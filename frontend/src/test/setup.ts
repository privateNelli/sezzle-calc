import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

import { resetEndpointMonitor } from '../features/calculator/api/monitor'

beforeEach(() => {
  resetEndpointMonitor()
})
