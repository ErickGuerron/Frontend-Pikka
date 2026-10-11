import type { Coordinate } from '@/features/geo/types'
import { enumValue, number, object, ParseError, string } from '@/shared/api/parse'
import { MIN_ZONE_VERTICES } from './geometry'

export type { Coordinate }

/** Modelo de zona según zones.v1 (contracts/proto/zones/v1/zones.proto). */

export interface Zone {
  id: string
  code: string
  name: string
  /** Anillo exterior cerrado: el primer punto coincide con el último. */
  ring: Coordinate[]
  /** Huecos (dona): anillos cerrados dentro del exterior. Vacío si no hay. */
  holes: Coordinate[][]
  /** Activa: clasifica puntos y valida pedidos. Inactiva: se conserva para el historial. */
  status: ZoneStatus
  /** Motivo del último cambio de estado. Vacío si nunca se ha desactivado. */
  statusReason: string
  /** RFC 3339, UTC. */
  createdAt: string
}

export const zoneStatuses = ['ACTIVE', 'INACTIVE'] as const
export type ZoneStatus = (typeof zoneStatuses)[number]

export const zoneStatusLabels: Record<ZoneStatus, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
}

export function parseCoordinate(data: unknown): Coordinate {
  const o = object(data, 'coordinate')
  return { latitude: number(o, 'latitude'), longitude: number(o, 'longitude') }
}

function parseRing(data: unknown, what: string): Coordinate[] {
  if (!Array.isArray(data)) throw new ParseError(`${what}: expected array`)
  return data.map((point) => parseCoordinate(point))
}

export function parseZone(data: unknown): Zone {
  const o = object(data, 'zone')
  // Las zonas anteriores a los huecos no traen el campo: se leen como sin huecos.
  const holes = o.holes === undefined ? [] : parseHoles(o.holes)
  // Las respuestas anteriores a la desactivación no traen estado: se leen como activas.
  const status = o.status === undefined ? 'ACTIVE' : enumValue(o.status, zoneStatuses, 'status')
  return {
    id: string(o, 'id'),
    code: string(o, 'code'),
    name: string(o, 'name'),
    ring: parseRing(o.ring, 'ring'),
    holes,
    status,
    statusReason: o.statusReason === undefined ? '' : string(o, 'statusReason'),
    createdAt: string(o, 'createdAt'),
  }
}

function parseHoles(data: unknown): Coordinate[][] {
  if (!Array.isArray(data)) throw new ParseError('holes: expected array')
  return data.map((hole) => parseRing(hole, 'hole'))
}

/** Un anillo cerrado tiene los vértices más el punto de cierre, y el primero coincide con el último. */
export function isClosedRing(ring: readonly Coordinate[]): boolean {
  if (ring.length < MIN_ZONE_VERTICES + 1) return false
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first === undefined || last === undefined) return false
  return first.latitude === last.latitude && first.longitude === last.longitude
}
