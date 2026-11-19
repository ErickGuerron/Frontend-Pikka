import type { GeneratedRoute, PlannedStop, RoutePlan } from './types'

/**
 * Ajustes manuales del plan (Sprint 4). Funciones puras: devuelven un plan nuevo y no tocan
 * el original. El servidor es quien valida capacidad, fecha y zona (ADR 0007).
 */

/** Pedidos del plan que no tienen repartidor todavía. */
export function unassignedOrders(plan: RoutePlan): string[] {
  return plan.unassignedOrderIds
}

/** Asigna un pedido sin repartidor al final de una ruta. */
export function insertUnassignedOrder(plan: RoutePlan, orderId: string, toRouteId: string, address: string): RoutePlan {
  const target = plan.routes.find((route) => route.id === toRouteId)
  if (target === undefined) throw new RangeError(`ruta desconocida: ${toRouteId}`)
  if (!plan.unassignedOrderIds.includes(orderId)) throw new RangeError(`el pedido ${orderId} ya tiene repartidor`)
  const stop: PlannedStop = { orderId, address, sequence: target.stops.length + 1 }
  return {
    ...plan,
    routes: plan.routes.map((route) => (route.id === toRouteId ? { ...route, stops: [...route.stops, stop] } : route)),
    unassignedOrderIds: plan.unassignedOrderIds.filter((id) => id !== orderId),
  }
}

/** Mueve una parada a otra ruta del mismo plan, al final, y renumera ambas rutas. */
export function moveStop(plan: RoutePlan, orderId: string, toRouteId: string): RoutePlan {
  const from = plan.routes.find((route) => route.stops.some((stop) => stop.orderId === orderId))
  if (from === undefined) throw new RangeError(`el pedido ${orderId} no está en el plan`)
  if (from.id === toRouteId) return plan
  const target = plan.routes.find((route) => route.id === toRouteId)
  if (target === undefined) throw new RangeError(`ruta desconocida: ${toRouteId}`)
  const moving = from.stops.find((stop) => stop.orderId === orderId)
  if (moving === undefined) throw new RangeError(`el pedido ${orderId} no está en la ruta de origen`)

  return {
    ...plan,
    routes: plan.routes.map((route) => {
      if (route.id === from.id) return renumber({ ...route, stops: route.stops.filter((stop) => stop.orderId !== orderId) })
      if (route.id === toRouteId) return renumber({ ...route, stops: [...route.stops, moving] })
      return route
    }),
  }
}

function renumber(route: GeneratedRoute): GeneratedRoute {
  return { ...route, stops: route.stops.map((stop, index) => ({ ...stop, sequence: index + 1 })) }
}
