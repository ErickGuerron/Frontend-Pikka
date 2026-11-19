import type { Coordinate } from '@/features/geo/types'
import type { WeekdayCode, ZoneSettings } from './settings'

/** Cálculos geográficos y de horario que muestran los paneles. No sustituyen al backend: son informativos. */

const EARTH_RADIUS_KM = 6371

/** Distancia en línea recta (haversine) entre dos puntos, en km. No es distancia de ruteo. */
export function straightLineKm(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Área de un anillo cerrado en km², con proyección local plana (válida para una zona urbana). */
export function ringAreaKm2(ring: readonly Coordinate[]): number {
  if (ring.length < 4) return 0
  const refLat = ring.reduce((sum, p) => sum + p.latitude, 0) / ring.length
  const kmPerDegLat = (Math.PI * EARTH_RADIUS_KM) / 180
  const kmPerDegLng = kmPerDegLat * Math.cos((refLat * Math.PI) / 180)
  let twiceArea = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i]
    const b = ring[i + 1]
    if (a === undefined || b === undefined) continue
    const ax = a.longitude * kmPerDegLng
    const ay = a.latitude * kmPerDegLat
    const bx = b.longitude * kmPerDegLng
    const by = b.latitude * kmPerDegLat
    twiceArea += ax * by - bx * ay
  }
  return Math.abs(twiceArea) / 2
}

/** Área neta de la zona: exterior menos huecos. */
export function zoneAreaKm2(ring: readonly Coordinate[], holes: readonly (readonly Coordinate[])[]): number {
  return Math.max(0, ringAreaKm2(ring) - holes.reduce((sum, hole) => sum + ringAreaKm2(hole), 0))
}

/** Punto dentro de un anillo (ray casting). El anillo puede venir cerrado o abierto. */
export function pointInRing(point: Coordinate, ring: readonly Coordinate[]): boolean {
  const pts = ring.length > 1 && sameCoordinate(ring[0], ring[ring.length - 1]) ? ring.slice(0, -1) : ring
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const pi = pts[i]
    const pj = pts[j]
    if (pi === undefined || pj === undefined) continue
    const crosses =
      pi.latitude > point.latitude !== pj.latitude > point.latitude &&
      point.longitude < ((pj.longitude - pi.longitude) * (point.latitude - pi.latitude)) / (pj.latitude - pi.latitude) + pi.longitude
    if (crosses) inside = !inside
  }
  return inside
}

function sameCoordinate(a: Coordinate | undefined, b: Coordinate | undefined): boolean {
  return a !== undefined && b !== undefined && a.latitude === b.latitude && a.longitude === b.longitude
}

/** Día de la semana y minutos transcurridos del día, en la zona horaria indicada. */
export interface LocalClock {
  weekday: WeekdayCode
  minutes: number
}

const weekdayFromShort: Record<string, WeekdayCode> = {
  Mon: 'MON',
  Tue: 'TUE',
  Wed: 'WED',
  Thu: 'THU',
  Fri: 'FRI',
  Sat: 'SAT',
  Sun: 'SUN',
}

export function localClock(timezone: string, now: Date = new Date()): LocalClock | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
    const weekday = weekdayFromShort[parts.find((p) => p.type === 'weekday')?.value ?? '']
    const hour = Number(parts.find((p) => p.type === 'hour')?.value)
    const minute = Number(parts.find((p) => p.type === 'minute')?.value)
    if (weekday === undefined || Number.isNaN(hour) || Number.isNaN(minute)) return null
    return { weekday, minutes: hour * 60 + minute }
  } catch {
    // Zona horaria no soportada por el navegador: el panel lo omite en vez de inventar datos.
    return null
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Situación de la zona frente al horario de corte de hoy. */
export interface CutoffStatus {
  serviceToday: boolean
  /** Hay pedidos para entregar hoy: hoy es día de servicio y aún no pasa la hora de corte. */
  acceptsToday: boolean
  minutesToCutoff: number | null
}

export function cutoffStatus(settings: ZoneSettings, clock: LocalClock | null): CutoffStatus | null {
  if (clock === null) return null
  const serviceToday = settings.serviceDays.includes(clock.weekday)
  const cutoff = toMinutes(settings.cutoffTime)
  const minutesToCutoff = cutoff - clock.minutes
  return {
    serviceToday,
    acceptsToday: serviceToday && minutesToCutoff > 0,
    minutesToCutoff: serviceToday ? minutesToCutoff : null,
  }
}

/** "2h 45m" a partir de minutos. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${String(h)}h ${String(m)}m` : `${String(m)}m`
}
