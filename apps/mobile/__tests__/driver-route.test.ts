import { ApiError } from '../src/api/errors'
import { getDemoRoute, registerDemoResult, resetDemoRoute } from '../src/features/driver-route/demo'
import {
  canRegisterResult,
  orderedStops,
  parseDriverRoute,
  remainingCount,
  validateStopResult,
  type RouteStop,
} from '../src/features/driver-route/types'

const validRoute = {
  id: 'r1',
  stops: [
    { id: 's2', sequence: 2, address: 'Calle B', windowStart: '12:00', windowEnd: '15:00', status: 'PENDING', reason: null },
    { id: 's1', sequence: 1, address: 'Calle A', windowStart: '09:00', windowEnd: '12:00', status: 'DELIVERED', reason: null },
  ],
}

function stop(over: Partial<RouteStop> = {}): RouteStop {
  return { id: 's', sequence: 1, address: 'Calle', windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null, ...over }
}

describe('parseDriverRoute', () => {
  it('parses a valid route', () => {
    const route = parseDriverRoute(validRoute)
    expect(route.id).toBe('r1')
    expect(route.stops).toHaveLength(2)
    expect(route.stops[0]?.reason).toBeNull()
  })

  it('rejects an unknown stop status and an unknown reason', () => {
    expect(() => parseDriverRoute({ id: 'r', stops: [{ ...validRoute.stops[0], status: 'LOST' }] })).toThrow()
    expect(() => parseDriverRoute({ id: 'r', stops: [{ ...validRoute.stops[0], status: 'NOT_DELIVERED', reason: 'OTRO' }] })).toThrow()
  })

  it('rejects a payload without stops', () => {
    expect(() => parseDriverRoute({ id: 'r' })).toThrow()
  })
})

describe('route rules', () => {
  it('orders stops by sequence without mutating the input', () => {
    const route = parseDriverRoute(validRoute)
    const ordered = orderedStops(route.stops)
    expect(ordered.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(route.stops[0]?.id).toBe('s2')
  })

  it('only pending stops accept a result', () => {
    expect(canRegisterResult(stop({ status: 'PENDING' }))).toBe(true)
    expect(canRegisterResult(stop({ status: 'DELIVERED' }))).toBe(false)
    expect(canRegisterResult(stop({ status: 'NOT_DELIVERED', reason: 'CLIENT_ABSENT' }))).toBe(false)
  })

  it('requires a reason for a failed stop and forbids one for a delivered stop', () => {
    expect(validateStopResult({ outcome: 'NOT_DELIVERED' })).not.toBeNull()
    expect(validateStopResult({ outcome: 'NOT_DELIVERED', reason: 'CLIENT_ABSENT' })).toBeNull()
    expect(validateStopResult({ outcome: 'DELIVERED' })).toBeNull()
    expect(validateStopResult({ outcome: 'DELIVERED', reason: 'CLIENT_ABSENT' })).not.toBeNull()
  })

  it('counts pending stops', () => {
    expect(remainingCount(parseDriverRoute(validRoute).stops)).toBe(1)
  })
})

describe('demo driver route', () => {
  beforeEach(() => {
    resetDemoRoute()
  })

  it('registers a delivered result and reflects it in the route', async () => {
    const updated = await registerDemoResult('route-demo-1', 'stop-1', { outcome: 'DELIVERED' })
    expect(updated.status).toBe('DELIVERED')
    const route = await getDemoRoute()
    expect(route.stops.find((s) => s.id === 'stop-1')?.status).toBe('DELIVERED')
  })

  it('registers a failed stop with its reason', async () => {
    const updated = await registerDemoResult('route-demo-1', 'stop-2', { outcome: 'NOT_DELIVERED', reason: 'WRONG_ADDRESS' })
    expect(updated).toMatchObject({ status: 'NOT_DELIVERED', reason: 'WRONG_ADDRESS' })
  })

  it('refuses a second result for the same stop', async () => {
    await registerDemoResult('route-demo-1', 'stop-1', { outcome: 'DELIVERED' })
    await expect(registerDemoResult('route-demo-1', 'stop-1', { outcome: 'DELIVERED' })).rejects.toMatchObject({ status: 409 })
  })

  it('refuses an invalid result and unknown ids', async () => {
    await expect(registerDemoResult('route-demo-1', 'stop-3', { outcome: 'NOT_DELIVERED' })).rejects.toBeInstanceOf(ApiError)
    await expect(registerDemoResult('route-demo-1', 'nope', { outcome: 'DELIVERED' })).rejects.toMatchObject({ status: 404 })
    await expect(registerDemoResult('otra', 'stop-1', { outcome: 'DELIVERED' })).rejects.toMatchObject({ status: 404 })
  })
})
