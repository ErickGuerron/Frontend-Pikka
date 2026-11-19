import type { MapRoute } from './RouteMap'

/** Lo mínimo de una ruta, sea propuesta (plan) o en proceso (seguimiento). */
export interface RouteLike {
  id: string
  driverName: string
  stops: readonly { orderId: string; sequence: number; status?: string }[]
}

const ROUTE_COLORS = ['#0e7075', '#b45309', '#6d28d9', '#be123c', '#1d4ed8', '#15803d']

/**
 * Rutas listas para dibujar, con una parada por pedido que tenga coordenadas. Las coordenadas salen de la
 * lista de pedidos, porque el plan y el seguimiento solo traen dirección y orden.
 */
export function toMapRoutes(
  routes: readonly RouteLike[],
  coords: ReadonlyMap<string, { latitude: number; longitude: number }>,
): MapRoute[] {
  return routes
    .map((route, i) => ({
      id: route.id,
      driverName: route.driverName === '' ? 'Sin repartidor' : route.driverName,
      color: ROUTE_COLORS[i % ROUTE_COLORS.length] ?? '#0e7075',
      stops: [...route.stops]
        .sort((a, b) => a.sequence - b.sequence)
        .flatMap((s) => {
          const at = coords.get(s.orderId)
          const done = s.status === 'DELIVERED' || s.status === 'NOT_DELIVERED'
          return at ? [{ orderId: s.orderId, sequence: s.sequence, latitude: at.latitude, longitude: at.longitude, done }] : []
        }),
    }))
    .filter((route) => route.stops.length > 0)
}
