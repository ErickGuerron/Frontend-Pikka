import { ApiError } from '../src/api/errors'
import { advanceDemoStatus, getDemoRoute, registerDemoResult, resetDemoRoute } from '../src/features/driver-route/demo'
import {
  canRegisterResult,
  completedCount,
  nextProgressStatus,
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

  it('stops without a final result accept a result', () => {
    expect(canRegisterResult(stop({ status: 'PENDING' }))).toBe(true)
    expect(canRegisterResult(stop({ status: 'PICKED_UP' }))).toBe(true)
    expect(canRegisterResult(stop({ status: 'IN_TRANSIT' }))).toBe(true)
    expect(canRegisterResult(stop({ status: 'DELIVERED' }))).toBe(false)
    expect(canRegisterResult(stop({ status: 'NOT_DELIVERED', reason: 'CLIENT_ABSENT' }))).toBe(false)
  })

  it('advances one step at a time: PENDING -> PICKED_UP -> IN_TRANSIT -> none', () => {
    expect(nextProgressStatus(stop({ status: 'PENDING' }))).toBe('PICKED_UP')
    expect(nextProgressStatus(stop({ status: 'PICKED_UP' }))).toBe('IN_TRANSIT')
    expect(nextProgressStatus(stop({ status: 'IN_TRANSIT' }))).toBeNull()
    expect(nextProgressStatus(stop({ status: 'DELIVERED' }))).toBeNull()
  })

  it('counts completed stops as those with a final result', () => {
    const stops = [
      stop({ id: 'a', status: 'DELIVERED' }),
      stop({ id: 'b', status: 'NOT_DELIVERED', reason: 'CLIENT_ABSENT' }),
      stop({ id: 'c', status: 'IN_TRANSIT' }),
      stop({ id: 'd', status: 'PENDING' }),
    ]
    expect(completedCount(stops)).toBe(2)
    expect(remainingCount(stops)).toBe(2)
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

const here = { latitude: -0.181, longitude: -78.468 }

describe('demo driver route', () => {
  beforeEach(() => {
    resetDemoRoute()
  })

  it('registers a delivered result and reflects it in the route', async () => {
    const updated = await registerDemoResult('route-demo-1', 'stop-1', { location: here, outcome: 'DELIVERED' })
    expect(updated.status).toBe('DELIVERED')
    const route = await getDemoRoute()
    expect(route.stops.find((s) => s.id === 'stop-1')?.status).toBe('DELIVERED')
  })

  it('registers a failed stop with its reason', async () => {
    const updated = await registerDemoResult('route-demo-1', 'stop-2', { location: here, outcome: 'NOT_DELIVERED', reason: 'WRONG_ADDRESS' })
    expect(updated).toMatchObject({ status: 'NOT_DELIVERED', reason: 'WRONG_ADDRESS' })
  })

  it('refuses a second result for the same stop', async () => {
    await registerDemoResult('route-demo-1', 'stop-1', { location: here, outcome: 'DELIVERED' })
    await expect(registerDemoResult('route-demo-1', 'stop-1', { location: here, outcome: 'DELIVERED' })).rejects.toMatchObject({ status: 409 })
  })

  it('advances a stop through recogido and en camino, in order', async () => {
    const picked = await advanceDemoStatus('route-demo-1', 'stop-1', 'PICKED_UP')
    expect(picked.status).toBe('PICKED_UP')
    const transit = await advanceDemoStatus('route-demo-1', 'stop-1', 'IN_TRANSIT')
    expect(transit.status).toBe('IN_TRANSIT')
  })

  it('refuses to skip a step or to advance a stop that already has a result', async () => {
    await expect(advanceDemoStatus('route-demo-1', 'stop-1', 'IN_TRANSIT')).rejects.toMatchObject({ status: 409 })
    await registerDemoResult('route-demo-1', 'stop-1', { location: here, outcome: 'DELIVERED' })
    await expect(advanceDemoStatus('route-demo-1', 'stop-1', 'PICKED_UP')).rejects.toMatchObject({ status: 409 })
  })

  it('accepts a result while the stop is in transit', async () => {
    await advanceDemoStatus('route-demo-1', 'stop-2', 'PICKED_UP')
    await advanceDemoStatus('route-demo-1', 'stop-2', 'IN_TRANSIT')
    const done = await registerDemoResult('route-demo-1', 'stop-2', { location: here, outcome: 'DELIVERED' })
    expect(done.status).toBe('DELIVERED')
  })

  it('refuses an invalid result and unknown ids', async () => {
    await expect(registerDemoResult('route-demo-1', 'stop-3', { location: here, outcome: 'NOT_DELIVERED' })).rejects.toBeInstanceOf(ApiError)
    await expect(registerDemoResult('route-demo-1', 'nope', { location: here, outcome: 'DELIVERED' })).rejects.toMatchObject({ status: 404 })
    await expect(registerDemoResult('otra', 'stop-1', { location: here, outcome: 'DELIVERED' })).rejects.toMatchObject({ status: 404 })
  })
})

describe('stop coordinates', () => {
  const base = { id: 's', sequence: 1, address: 'a', windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null }

  it('keeps latitude and longitude when the backend sends both', () => {
    expect(parseDriverRoute({ id: 'r', stops: [{ ...base, latitude: -0.2, longitude: -78.5 }] }).stops[0]).toMatchObject({ latitude: -0.2, longitude: -78.5 })
  })

  it('leaves them out otherwise', () => {
    expect(parseDriverRoute({ id: 'r', stops: [{ ...base, latitude: -0.2 }] }).stops[0]).not.toHaveProperty('latitude')
  })
})

describe('parseDriverRoute: capacidad de la ruta', () => {
  it('lee max_orders cuando el servidor lo envia', () => {
    expect(parseDriverRoute({ ...validRoute, max_orders: 10 }).maxOrders).toBe(10)
  })

  it('sin max_orders la capacidad es desconocida (null), no cero', () => {
    expect(parseDriverRoute(validRoute).maxOrders).toBeNull()
  })
})