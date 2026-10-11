import { http } from '@/shared/api/client'
import { zoneShapeError } from './geometry'
import { type Coordinate, type Zone, isClosedRing, parseZone } from './types'

export interface NewZone {
  code: string
  name: string
  /** Anillo cerrado: el primer punto coincide con el último. */
  ring: Coordinate[]
}

/** Rutas publicadas en contracts/openapi/openapi.yaml (Backend-Pikka). */
export function getZone(id: string): Promise<Zone> {
  return http.get(`/api/v1/zones/${encodeURIComponent(id)}`, parseZone)
}

/**
 * Registra una zona. Rechaza en el cliente anillos abiertos o figuras no convexas
 * antes de llamar a la API; el backend vuelve a validarlo igual.
 */
export function createZone(input: NewZone): Promise<Zone> {
  if (!isClosedRing(input.ring)) {
    return Promise.reject(new RangeError('ring: el anillo debe cerrarse sobre su primer punto'))
  }
  const shapeError = zoneShapeError(input.ring.slice(0, -1))
  if (shapeError !== null) {
    return Promise.reject(new RangeError(`ring: ${shapeError}`))
  }
  return http.post('/api/v1/zones', parseZone, { body: input })
}

/** Devuelve la zona que contiene una coordenada. La API responde 404 si ninguna la contiene. */
export function classifyPoint(point: Coordinate, signal?: AbortSignal): Promise<Zone> {
  const query = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
  })
  return http.get(`/api/v1/zones/classify?${query.toString()}`, parseZone, { signal })
}
