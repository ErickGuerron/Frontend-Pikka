import { http } from '@/shared/api/client'
import { listDemoDrivers } from './demo'
import { parseDrivers, type Driver } from './types'

/**
 * PLANNED, NOT IMPLEMENTED: GET /api/v1/drivers is not in the OpenAPI yet. Until the Gateway
 * serves it, VITE_MOCK_DRIVERS=true swaps in a demo list.
 */
export function isDriversDemoMode(): boolean {
  return import.meta.env.VITE_MOCK_DRIVERS === 'true'
}

export function listDrivers(): Promise<Driver[]> {
  if (isDriversDemoMode()) return listDemoDrivers()
  return http.get('/api/v1/drivers', parseDrivers)
}
