import type { MapState } from '../customer-orders/map/document'
import type { Coordinate } from '../customer-orders/map/geo'

/** Pedido de encuadre: el mapa ajusta la vista a estos puntos cada vez que cambia la key. */
export interface FitRequest {
  points: Coordinate[]
  key: string
}

interface RouteMapOptions {
  /** Camino por calles de la ruta óptima, en orden de visita. */
  road?: Coordinate[]
  /** Puntos a encuadrar; la key cambia cuando el repartidor pide re-encuadrar. */
  fit?: Coordinate[] | null
  fitKey?: string
}

/**
 * Map state of the driver's route: the pending stops in order, the driver's own position, the optimal road
 * and an optional fit request. A route has no delivery zones, picked point or focus.
 */
export function routeMapState(stops: readonly Coordinate[], driver: Coordinate | null, options: RouteMapOptions = {}): MapState {
  const fit = options.fit && options.fit.length > 0
    ? { points: [...options.fit], key: options.fitKey ?? JSON.stringify(options.fit) }
    : null
  return {
    zones: [],
    picked: null,
    focus: null,
    highlightId: null,
    stops: [...stops],
    driver,
    road: options.road ? [...options.road] : [],
    fit,
  }
}
