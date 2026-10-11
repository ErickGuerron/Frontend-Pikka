import { http } from '@/shared/api/client'
import { type Coordinate, type Zone, isClosedRing, parseZone } from './types'

export interface NewZone {
  code: string
  name: string
  /** Anillo cerrado: el primer punto coincide con el último. */
  ring: Coordinate[]
}

/**
 * Rutas provisionales: el contrato del Gateway aún no expone zonas por REST
 * (zones.v1 es gRPC). Se integran cuando Backend publique el OpenAPI.
 */
export function getZone(id: string): Promise<Zone> {
  return http.get(`/api/v1/zones/${encodeURIComponent(id)}`, parseZone)
}

/** Registra una zona. Rechaza en el cliente anillos abiertos antes de llamar a la API. */
export function createZone(input: NewZone): Promise<Zone> {
  if (!isClosedRing(input.ring)) {
    return Promise.reject(new RangeError('ring: el anillo debe tener al menos 4 puntos y cerrar sobre sí mismo'))
  }
  return http.post('/api/v1/zones', parseZone, { body: input })
}

/** Devuelve la zona que contiene una coordenada. La API responde 404 si ninguna la contiene. */
export function classifyPoint(point: Coordinate): Promise<Zone> {
  const query = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
  })
  return http.get(`/api/v1/zones/classify?${query.toString()}`, parseZone)
}
