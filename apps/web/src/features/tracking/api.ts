import { http } from '@/shared/api/client'
import { listDemoActiveRoutes } from './demo'
import { parseTrackedRoutes, type TrackedRoute } from './types'

/**
 * PLANNED, NOT IMPLEMENTED: the Tracking Service and its Gateway route do not exist yet.
 * GET /api/v1/tracking/routes/active is the REST snapshot the page polls. The live WebSocket
 * from the plan comes later and will push the same snapshot. VITE_MOCK_TRACKING=true uses a demo.
 */
export function isTrackingDemoMode(): boolean {
  return import.meta.env.VITE_MOCK_TRACKING === 'true'
}

/**
 * "true" connects the live WebSocket. Off by default: the Gateway does not serve the socket
 * yet, and turning it on early would only produce reconnect noise.
 */
export function isTrackingLiveEnabled(): boolean {
  return import.meta.env.VITE_TRACKING_LIVE === 'true'
}

export function listActiveRoutes(): Promise<TrackedRoute[]> {
  if (isTrackingDemoMode()) return listDemoActiveRoutes()
  return http.get('/api/v1/tracking/routes/active', parseTrackedRoutes)
}

/** Intervalo del respaldo REST, en milisegundos, mientras no hay WebSocket. */
export const SNAPSHOT_INTERVAL_MS = 10_000
