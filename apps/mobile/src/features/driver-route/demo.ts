import { ApiError } from '../../api/errors'
import type { DriverRoute, RouteStop, StopResultInput } from './types'
import { validateStopResult } from './types'

/**
 * In-memory route for EXPO_PUBLIC_MOCK_DRIVER_ROUTE=true. It stands in for the planned
 * endpoints until the Gateway serves them. Nothing here is persisted or sent anywhere.
 */
const initialRoute: DriverRoute = {
  id: 'route-demo-1',
  stops: [
    { id: 'stop-1', sequence: 1, address: 'Av. Amazonas N24-03, Quito', windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null },
    { id: 'stop-2', sequence: 2, address: 'Calle Juan León Mera 1224, Quito', windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null },
    { id: 'stop-3', sequence: 3, address: 'Av. 6 de Diciembre 2540, Quito', windowStart: '12:00', windowEnd: '15:00', status: 'PENDING', reason: null },
    { id: 'stop-4', sequence: 4, address: 'Av. Eloy Alfaro N35-20, Quito', windowStart: '15:00', windowEnd: '18:00', status: 'PENDING', reason: null },
  ],
}

let route: DriverRoute = clone(initialRoute)

function clone(value: DriverRoute): DriverRoute {
  return { id: value.id, stops: value.stops.map((s) => ({ ...s })) }
}

export function getDemoRoute(): Promise<DriverRoute> {
  return Promise.resolve(clone(route))
}

export function registerDemoResult(routeId: string, stopId: string, input: StopResultInput): Promise<RouteStop> {
  if (routeId !== route.id) return Promise.reject(new ApiError(404, 'NOT_FOUND', 'route not found'))
  const stop = route.stops.find((s) => s.id === stopId)
  if (stop === undefined) return Promise.reject(new ApiError(404, 'NOT_FOUND', 'stop not found'))
  if (stop.status !== 'PENDING') {
    return Promise.reject(new ApiError(409, 'CONFLICT', `stop already registered as ${stop.status}`))
  }
  const invalid = validateStopResult(input)
  if (invalid !== null) return Promise.reject(new ApiError(400, 'VALIDATION', invalid))
  const updated: RouteStop = { ...stop, status: input.outcome, reason: input.reason ?? null }
  route = { ...route, stops: route.stops.map((s) => (s.id === stopId ? updated : s)) }
  return Promise.resolve({ ...updated })
}

/** Test helper: returns the demo route to its initial state. */
export function resetDemoRoute(): void {
  route = clone(initialRoute)
}
