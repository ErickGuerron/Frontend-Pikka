import { http } from '@/shared/api/client'
import { listDemoActiveRoutes } from './demo'
import { parseTrackedRoutes, type TrackedRoute } from './types'

/**
 * GET /api/v1/tracking/routes/active (Gateway, ADMIN and OPERATOR) is the REST snapshot the page
 * polls. The live WebSocket from the plan comes later and will push the same snapshot.
 * VITE_MOCK_TRACKING=true uses a demo.
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

/**
 * Cada cuánto se vuelve a pedir el estado de las rutas, en milisegundos. Son 3 minutos para no cargar el
 * servidor: cada consulta recorre pedidos, repartidores y posiciones. El operador puede pedirlo antes con "Actualizar".
 */
export const SNAPSHOT_INTERVAL_MS = 180_000
