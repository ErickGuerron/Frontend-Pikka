import { http } from '@/shared/api/client'
import { holeFitError, zoneShapeError } from './geometry'
import { type Coordinate, type Zone, isClosedRing, parseZone } from './types'

export interface NewZone {
  code: string
  name: string
  /** Anillo exterior cerrado: el primer punto coincide con el último. */
  ring: Coordinate[]
  /** Huecos opcionales (dona), cada uno cerrado. */
  holes?: Coordinate[][]
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
  const outer = input.ring.slice(0, -1)
  const shapeError = zoneShapeError(outer)
  if (shapeError !== null) {
    return Promise.reject(new RangeError(`ring: ${shapeError}`))
  }

  const holes = input.holes ?? []
  const placed: Coordinate[][] = []
  for (const hole of holes) {
    if (!isClosedRing(hole)) {
      return Promise.reject(new RangeError('holes: cada hueco debe cerrarse sobre su primer punto'))
    }
    const vertices = hole.slice(0, -1)
    const fitError = holeFitError(vertices, outer, placed)
    if (fitError !== null) {
      return Promise.reject(new RangeError(`holes: ${fitError}`))
    }
    placed.push(vertices)
  }

  // Sin huecos el cuerpo es el de siempre; el backend acepta el campo opcional.
  const body = holes.length > 0 ? input : { code: input.code, name: input.name, ring: input.ring }
  return http.post('/api/v1/zones', parseZone, { body })
}

/** Devuelve la zona que contiene una coordenada. La API responde 404 si ninguna la contiene. */
export function classifyPoint(point: Coordinate, signal?: AbortSignal): Promise<Zone> {
  const query = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
  })
  return http.get(`/api/v1/zones/classify?${query.toString()}`, parseZone, { signal })
}
