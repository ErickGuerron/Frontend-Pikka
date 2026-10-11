import { describe, expect, it } from 'vitest'
import { type Coordinate, isClosedRing, parseZone } from './types'

const s1: Coordinate = { latitude: -0.2, longitude: -78.5 }
const s2: Coordinate = { latitude: -0.2, longitude: -78.4 }
const s3: Coordinate = { latitude: -0.1, longitude: -78.4 }
const s4: Coordinate = { latitude: -0.1, longitude: -78.5 }
const closedRing: Coordinate[] = [s1, s2, s3, s4, s1]

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
  it('acepta un anillo cerrado de 4 vértices y el punto de cierre', () => {
    expect(isClosedRing(closedRing)).toBe(true)
  })

  it('rechaza un anillo abierto', () => {
    expect(isClosedRing([s1, s2, s3, s4])).toBe(false)
  })

  it('rechaza un anillo de 3 vértices aunque cierre: un triángulo no es una zona', () => {
    expect(isClosedRing([s1, s2, s3, s1])).toBe(false)
  })
})
