import { http } from '../../api/client'
import { isDriverDemoMode } from '../../api/config'
import { ApiError } from '../../api/errors'
import { advanceDemoStatus, getDemoRoute, registerDemoResult } from './demo'
import {
  parseDriverRoute,
  parseRouteStop,
  parseStopProgress,
  type DriverRoute,
  type ProgressStatus,
  type RouteStop,
  type StopProgress,
  type StopResultInput,
} from './types'

/**
 * Driver route endpoints.
 *
 * NOT IMPLEMENTED: the API Gateway does not serve GET /api/v1/drivers/me/route nor the stop
 * result below (both answer 501). Until then EXPO_PUBLIC_MOCK_DRIVER_ROUTE=true swaps in an
 * in-memory demo. The stop status PATCH is served.
 *
 * GPS: the result carries the driver's location (ADR 0007, section 4), captured with
 * expo-location at the moment of registration.
 */

/** The endpoint is missing or unreachable: show "service not available", not a crash. */
export function isRouteUnavailable(error: unknown): boolean {
  return error instanceof ApiError && [0, 404, 501, 502, 503, 504].includes(error.status)
}

export function getMyRoute(signal?: AbortSignal): Promise<DriverRoute> {
  if (isDriverDemoMode()) return getDemoRoute()
  return http.get('/api/v1/drivers/me/route', parseDriverRoute, signal ? { signal } : {})
}

/**
 * Advances a stop to PICKED_UP or IN_TRANSIT. The Gateway serves this route (PATCH) and answers
 * {stopId, status}; the route itself (GET /drivers/me/route) is still not served, so the stop
 * can only be reached through the demo or once that route exists.
 */
export function advanceStopStatus(routeId: string, stopId: string, to: ProgressStatus): Promise<StopProgress> {
  if (isDriverDemoMode()) {
    return advanceDemoStatus(routeId, stopId, to).then((stop) => ({ stopId: stop.id, status: stop.status }))
  }
  const path = `/api/v1/drivers/me/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}/status`
  return http.patch(path, parseStopProgress, { body: { status: to } })
}

export function registerStopResult(routeId: string, stopId: string, input: StopResultInput): Promise<RouteStop> {
  if (isDriverDemoMode()) return registerDemoResult(routeId, stopId, input)
  const path = `/api/v1/drivers/me/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}/result`
  return http.post(path, parseRouteStop, { body: input })
}
