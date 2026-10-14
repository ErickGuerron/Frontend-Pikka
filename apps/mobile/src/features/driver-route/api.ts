import { http } from '../../api/client'
import { isDriverDemoMode } from '../../api/config'
import { ApiError } from '../../api/errors'
import { getDemoRoute, registerDemoResult } from './demo'
import { parseDriverRoute, parseRouteStop, type DriverRoute, type RouteStop, type StopResultInput } from './types'

/**
 * Driver route endpoints.
 *
 * PLANNED, NOT IMPLEMENTED: the API Gateway does not serve these routes yet
 * (GET /api/v1/drivers/me/route and the stop result below). Until then
 * EXPO_PUBLIC_MOCK_DRIVER_ROUTE=true swaps in an in-memory demo.
 *
 * GPS: the result must carry the driver's location (ADR 0007, section 4). Capturing it
 * needs expo-location, which is not installed yet, so the body sends no location.
 */

/** The endpoint is missing or unreachable: show "service not available", not a crash. */
export function isRouteUnavailable(error: unknown): boolean {
  return error instanceof ApiError && [0, 404, 501, 502, 503, 504].includes(error.status)
}

export function getMyRoute(signal?: AbortSignal): Promise<DriverRoute> {
  if (isDriverDemoMode()) return getDemoRoute()
  return http.get('/api/v1/drivers/me/route', parseDriverRoute, signal ? { signal } : {})
}

export function registerStopResult(routeId: string, stopId: string, input: StopResultInput): Promise<RouteStop> {
  if (isDriverDemoMode()) return registerDemoResult(routeId, stopId, input)
  const path = `/api/v1/drivers/me/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}/result`
  return http.post(path, parseRouteStop, { body: input })
}
