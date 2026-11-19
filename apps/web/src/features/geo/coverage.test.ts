import { describe, expect, it } from 'vitest'
import { parseCoverageZones, zoneCovering, type CoverageZone } from './coverage'

const square = (min: number, max: number) => [
  { latitude: min, longitude: min },
  { latitude: min, longitude: max },
  { latitude: max, longitude: max },
  { latitude: max, longitude: min },
  { latitude: min, longitude: min },
]

const zone: CoverageZone = { id: 'z1', code: 'Z-1', name: 'Centro', ring: square(0, 10), holes: [square(4, 6)] }

describe('zoneCovering', () => {
  it('encuentra la zona que contiene el punto', () => {
    expect(zoneCovering({ latitude: 2, longitude: 2 }, [zone])?.id).toBe('z1')
  })

  it('el borde exterior cuenta como cubierto', () => {
    expect(zoneCovering({ latitude: 0, longitude: 5 }, [zone])?.id).toBe('z1')
    expect(zoneCovering({ latitude: 10, longitude: 10 }, [zone])?.id).toBe('z1')
  })

  it('un punto fuera de toda zona no está cubierto', () => {
    expect(zoneCovering({ latitude: 11, longitude: 5 }, [zone])).toBeNull()
    expect(zoneCovering({ latitude: 5, longitude: 5 }, [])).toBeNull()
  })

  it('el interior de un hueco no está cubierto, pero su borde sí', () => {
    expect(zoneCovering({ latitude: 5, longitude: 5 }, [zone])).toBeNull()
    expect(zoneCovering({ latitude: 4, longitude: 5 }, [zone])?.id).toBe('z1')
  })
})

describe('parseCoverageZones', () => {
  it('lee la lista { zones } con huecos opcionales', () => {
    const parsed = parseCoverageZones({ zones: [{ id: 'a', code: 'A', name: 'Zona A', ring: square(0, 1) }] })
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.holes).toEqual([])
  })

  it('rechaza una respuesta con otra forma', () => {
    expect(() => parseCoverageZones([])).toThrow()
    expect(() => parseCoverageZones({ zones: [{ id: 'a', code: 'A', name: 'x', ring: [{ latitude: 'x' }] }] })).toThrow()
  })
})
