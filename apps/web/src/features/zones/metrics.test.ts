import { describe, expect, it } from 'vitest'
import type { Coordinate } from '@/features/geo/types'
import { cutoffStatus, formatMinutes, localClock, pointInRing, ringAreaKm2, straightLineKm, zoneAreaKm2 } from './metrics'
import type { ZoneSettings } from './settings'

const p = (latitude: number, longitude: number): Coordinate => ({ latitude, longitude })
// Cuadrado de 0.1° por lado cerca del ecuador: unos 11.1 km por lado.
const square = [p(-0.2, -78.5), p(-0.2, -78.4), p(-0.1, -78.4), p(-0.1, -78.5), p(-0.2, -78.5)]
const innerHole = [p(-0.18, -78.48), p(-0.18, -78.42), p(-0.12, -78.42), p(-0.12, -78.48), p(-0.18, -78.48)]

const settings: ZoneSettings = {
  description: '',
  depotName: 'Hub Norte',
  depotLatitude: -0.179,
  depotLongitude: -78.483,
  maxOrdersPerRoute: 18,
  routeCapacityKg: 45,
  timezone: 'America/Guayaquil',
  serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  deliveryWindowFrom: '08:00',
  deliveryWindowTo: '20:00',
  cutoffTime: '14:00',
  dispatchTime: '15:30',
  priority: 'NORMAL',
  dailyOrderLimit: 250,
}

describe('straightLineKm', () => {
  it('mide un grado de longitud en el ecuador como unos 111 km', () => {
    expect(straightLineKm(p(0, 0), p(0, 1))).toBeCloseTo(111.2, 0)
  })

  it('es cero entre el mismo punto', () => {
    expect(straightLineKm(p(-0.179, -78.483), p(-0.179, -78.483))).toBe(0)
  })
})

describe('ringAreaKm2 y zoneAreaKm2', () => {
  it('calcula el área de un cuadrado de 0.1° como unos 123 km²', () => {
    expect(ringAreaKm2(square)).toBeCloseTo(123.6, 0)
  })

  it('resta los huecos del área neta', () => {
    const net = zoneAreaKm2(square, [innerHole])
    expect(net).toBeLessThan(ringAreaKm2(square))
    expect(net).toBeCloseTo(ringAreaKm2(square) - ringAreaKm2(innerHole), 6)
  })

  it('un anillo con menos de 3 vértices no tiene área', () => {
    expect(ringAreaKm2([p(0, 0), p(0, 1)])).toBe(0)
  })
})

describe('pointInRing', () => {
  it('reconoce un punto dentro del cuadrado', () => {
    expect(pointInRing(p(-0.15, -78.45), square)).toBe(true)
  })

  it('rechaza un punto fuera del cuadrado', () => {
    expect(pointInRing(p(-0.3, -78.45), square)).toBe(false)
  })

  it('da el mismo resultado con el anillo cerrado o abierto', () => {
    expect(pointInRing(p(-0.15, -78.45), square.slice(0, -1))).toBe(true)
  })
})

describe('localClock y cutoffStatus', () => {
  // 19:30 UTC del martes 13 de octubre de 2026 son las 14:30 en Guayaquil (UTC-5).
  const tuesdayAfternoon = new Date('2026-10-13T19:30:00Z')

  it('lee el día y los minutos en la zona horaria de la zona', () => {
    expect(localClock('America/Guayaquil', tuesdayAfternoon)).toEqual({ weekday: 'TUE', minutes: 14 * 60 + 30 })
  })

  it('después de la hora de corte ya no acepta pedidos para hoy', () => {
    const status = cutoffStatus(settings, localClock('America/Guayaquil', tuesdayAfternoon))
    expect(status).toMatchObject({ serviceToday: true, acceptsToday: false, minutesToCutoff: -30 })
  })

  it('antes del corte acepta pedidos y dice cuánto falta', () => {
    const morning = new Date('2026-10-13T15:00:00Z') // 10:00 en Guayaquil
    const status = cutoffStatus(settings, localClock('America/Guayaquil', morning))
    expect(status).toMatchObject({ acceptsToday: true, minutesToCutoff: 240 })
  })

  it('un domingo sin servicio no acepta pedidos', () => {
    const sunday = new Date('2026-10-11T15:00:00Z')
    const status = cutoffStatus(settings, localClock('America/Guayaquil', sunday))
    expect(status).toMatchObject({ serviceToday: false, acceptsToday: false, minutesToCutoff: null })
  })

  it('una zona horaria inválida no inventa un reloj', () => {
    expect(localClock('Mars/Olympus', tuesdayAfternoon)).toBeNull()
  })
})

describe('formatMinutes', () => {
  it('muestra horas y minutos', () => {
    expect(formatMinutes(165)).toBe('2h 45m')
    expect(formatMinutes(45)).toBe('45m')
  })
})
