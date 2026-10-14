import { ApiError } from '../../api/errors'
import type { DriverRoute, ProgressStatus, RouteStop, StopResultInput } from './types'
import { isFinal, nextProgressStatus, validateStopResult } from './types'

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

function findStop(routeId: string, stopId: string): RouteStop {
  if (routeId !== route.id) throw new ApiError(404, 'NOT_FOUND', 'route not found')
  const stop = route.stops.find((s) => s.id === stopId)
  if (stop === undefined) throw new ApiError(404, 'NOT_FOUND', 'stop not found')
  return stop
}

function replaceStop(updated: RouteStop): void {
  route = { ...route, stops: route.stops.map((s) => (s.id === updated.id ? updated : s)) }
}

export function getDemoRoute(): Promise<DriverRoute> {
  return Promise.resolve(clone(route))
}

/** Moves a stop to the next progress step only; any other jump is a conflict. */
export function advanceDemoStatus(routeId: string, stopId: string, to: ProgressStatus): Promise<RouteStop> {
  try {
    const stop = findStop(routeId, stopId)
    if (nextProgressStatus(stop) !== to) {
      throw new ApiError(409, 'CONFLICT', `stop in status ${stop.status} cannot move to ${to}`)
    }
    const updated: RouteStop = { ...stop, status: to }
    replaceStop(updated)
    return Promise.resolve({ ...updated })
  } catch (e) {
    return Promise.reject(e)
  }
}

export function registerDemoResult(routeId: string, stopId: string, input: StopResultInput): Promise<RouteStop> {
  try {
    const stop = findStop(routeId, stopId)
    if (isFinal(stop.status)) {
      throw new ApiError(409, 'CONFLICT', `stop already registered as ${stop.status}`)
    }
    const invalid = validateStopResult(input)
    if (invalid !== null) throw new ApiError(400, 'VALIDATION', invalid)
    const updated: RouteStop = { ...stop, status: input.outcome, reason: input.reason ?? null }
    replaceStop(updated)
    return Promise.resolve({ ...updated })
  } catch (e) {
    return Promise.reject(e)
  }
}

/** Test helper: returns the demo route to its initial state. */
export function resetDemoRoute(): void {
  route = clone(initialRoute)
}
