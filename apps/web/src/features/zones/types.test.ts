import { describe, expect, it } from 'vitest'
import { type Coordinate, isClosedRing, parseZone } from './types'

const p1: Coordinate = { latitude: 19.43, longitude: -99.13 }
const p2: Coordinate = { latitude: 19.44, longitude: -99.13 }
const p3: Coordinate = { latitude: 19.44, longitude: -99.12 }
const closedRing: Coordinate[] = [p1, p2, p3, p1]

const zoneJson = { id: 'z-1', code: 'CENTRO', name: 'Centro', ring: closedRing, createdAt: '2026-10-10T12:00:00Z' }

describe('parseZone', () => {
  it('convierte una zona válida según zones.v1', () => {
    const zone = parseZone(zoneJson)
    expect(zone.code).toBe('CENTRO')
    expect(zone.ring).toEqual(closedRing)
  })

  it('rechaza una respuesta sin anillo', () => {
    expect(() => parseZone({ ...zoneJson, ring: 'no-es-lista' })).toThrow('ring: expected array')
  })

  it('rechaza coordenadas no numéricas', () => {
    expect(() => parseZone({ ...zoneJson, ring: [{ latitude: '19.4', longitude: -99 }] })).toThrow('latitude: expected number')
  })
})

describe('isClosedRing', () => {
  it('acepta un anillo cerrado de al menos 4 puntos', () => {
    expect(isClosedRing(closedRing)).toBe(true)
  })

  it('rechaza un anillo abierto', () => {
    expect(isClosedRing([p1, p2, p3])).toBe(false)
    expect(isClosedRing([p1, p2, p3, p2])).toBe(false)
  })

  it('rechaza un anillo con menos de 4 puntos aunque cierre', () => {
    expect(isClosedRing([p1, p2, p1])).toBe(false)
  })
})
