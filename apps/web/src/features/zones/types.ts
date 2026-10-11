import { number, object, ParseError, string } from '@/shared/api/parse'

/**
 * Modelo de zona según zones.v1 (contracts/proto/zones/v1/zones.proto).
 * Las rutas REST de zonas aún no están en el OpenAPI del Gateway; este módulo
 * solo fija el modelo y las reglas que el backend ya define.
 */
export interface Coordinate {
  latitude: number
  longitude: number
}

export interface Zone {
  id: string
  code: string
  name: string
  /** Anillo cerrado: el primer punto coincide con el último. */
  ring: Coordinate[]
  /** RFC 3339, UTC. */
  createdAt: string
}

export function parseCoordinate(data: unknown): Coordinate {
  const o = object(data, 'coordinate')
  return { latitude: number(o, 'latitude'), longitude: number(o, 'longitude') }
}

export function parseZone(data: unknown): Zone {
  const o = object(data, 'zone')
  const ring = o.ring
  if (!Array.isArray(ring)) throw new ParseError('ring: expected array')
  return {
    id: string(o, 'id'),
    code: string(o, 'code'),
    name: string(o, 'name'),
    ring: ring.map((point) => parseCoordinate(point)),
    createdAt: string(o, 'createdAt'),
  }
}

/** Un anillo es válido si tiene al menos 4 puntos (triángulo cerrado) y el primero coincide con el último. */
export function isClosedRing(ring: readonly Coordinate[]): boolean {
  if (ring.length < 4) return false
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first === undefined || last === undefined) return false
  return first.latitude === last.latitude && first.longitude === last.longitude
}
