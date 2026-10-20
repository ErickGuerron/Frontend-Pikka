import type { Coordinate } from '../customer-orders/map/geo'

/**
 * Orden en que el repartidor atiende sus paradas activas. Si fijó un pedido, va primero; el resto sigue el
 * orden óptimo del plan. Ids que el plan no conoce (una parada nueva) se añaden al final.
 */
export function attendOrder(planOrder: readonly string[], pinnedId: string | null, activeIds: readonly string[]): string[] {
  const active = new Set(activeIds)
  const ordered = planOrder.filter((id) => active.has(id))
  for (const id of activeIds) {
    if (!ordered.includes(id)) ordered.push(id)
  }
  if (pinnedId === null || !active.has(pinnedId)) return ordered
  return [pinnedId, ...ordered.filter((id) => id !== pinnedId)]
}

/** Punto a encuadrar para el botón de re-encuadre: la parada fijada y la siguiente. */
export function focusPoints<T extends { latitude?: number; longitude?: number; id: string }>(
  attended: readonly T[],
): Coordinate[] {
  const points: Coordinate[] = []
  for (const stop of attended.slice(0, 2)) {
    if (stop.latitude !== undefined && stop.longitude !== undefined) {
      points.push({ latitude: stop.latitude, longitude: stop.longitude })
    }
  }
  return points
}
