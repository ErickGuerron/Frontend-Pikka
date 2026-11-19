import type { MapState } from './map/document'
import type { Coordinate } from './map/geo'

/** Encuadre pedido por el cliente. Cada toque manda una clave nueva: el mapa solo reencuadra cuando cambia. */
export interface FitRequest {
  points: Coordinate[]
  key: string
}

export interface TrackingMapInput {
  driver: Coordinate | null
  delivery: Coordinate | null
  road: Coordinate[]
  /** Con seguimiento activo, la vista vuela a cada nueva posicion del repartidor. */
  follow: boolean
  fit: FitRequest | null
}

/**
 * Estado del mapa de seguimiento. Sin repartidor se muestra el punto de entrega; con repartidor el encuadre inicial
 * ya los incluye a los dos, asi que la vista no se mueve sola salvo que el cliente pida seguirlo.
 */
export function trackingMapState({ driver, delivery, road, follow, fit }: TrackingMapInput): MapState {
  const focus = follow && driver !== null ? driver : driver === null ? delivery : null
  return {
    zones: [],
    picked: null,
    delivery,
    focus,
    highlightId: null,
    driver,
    road,
    fit,
  }
}
