import type { RoutePlan } from './types'

type PlanRoute = RoutePlan['routes'][number]

/** Ruta de Luis Andrade con dos paradas: base de los planes de las pruebas de rutas. */
export const luisRoute: PlanRoute = {
  id: 'route-1',
  driverId: 'd-1',
  driverName: 'Luis Andrade',
  stops: [
    { orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1 },
    { orderId: 'o-2', address: 'Calle Juan León Mera 1224', sequence: 2 },
  ],
}

export function buildRoutePlan(routes: PlanRoute[], unassignedOrderIds: string[] = ['o-9']): RoutePlan {
  return { id: 'plan-1', routes, unassignedOrderIds }
}

/** Plan con dos repartidores para los ajustes manuales de paradas (adjust). */
export const adjustPlan: RoutePlan = {
  id: 'plan-1',
  routes: [
    {
      id: 'r-1',
      driverId: 'd-1',
      driverName: 'Luis',
      stops: [
        { orderId: 'o-1', address: 'A', sequence: 1 },
        { orderId: 'o-2', address: 'B', sequence: 2 },
      ],
    },
    { id: 'r-2', driverId: 'd-2', driverName: 'María', stops: [{ orderId: 'o-3', address: 'C', sequence: 1 }] },
  ],
  unassignedOrderIds: ['o-9'],
}

/** Pedido PENDING tal como lo devuelve GET /api/v1/orders. */
export function pendingOrder(id: string, deliveryDate: string, address = `Calle ${id}`) {
  return {
    id,
    address,
    latitude: -0.18,
    longitude: -78.47,
    deliveryDate,
    windowStart: '09:00',
    windowEnd: '18:00',
    status: 'PENDING',
    reviewReasons: [],
    createdAt: '2026-11-18T12:00:00Z',
  }
}

/** Ruta en proceso tal como la devuelve GET /api/v1/tracking/routes/active. */
export function runningRoute(id: string, driverName: string, stops: Array<{ orderId: string; status?: string }>) {
  return {
    id,
    driverName,
    stops: stops.map((s, i) => ({ orderId: s.orderId, address: `Parada ${s.orderId}`, sequence: i + 1, status: s.status ?? 'PENDING' })),
  }
}

/** Gateway shape of POST /api/v1/routes/plan, built from an in-memory plan. */
export function asBackend(p: RoutePlan) {
  return {
    planId: p.id,
    unassignedOrderIds: p.unassignedOrderIds,
    routes: p.routes.map((r) => ({
      routeId: r.id,
      driverId: r.driverId,
      driverName: r.driverName,
      orderCount: r.stops.length,
      stops: r.stops,
    })),
  }
}
