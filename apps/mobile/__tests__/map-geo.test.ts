import { parseCoverageZones, zoneCovering, type CoverageZone } from '../src/features/customer-orders/map/geo'
import { parsePhotonFeatures } from '../src/features/customer-orders/map/photon'

const square = (north: number, south: number, east: number, west: number) => [
  { latitude: north, longitude: west },
  { latitude: north, longitude: east },
  { latitude: south, longitude: east },
  { latitude: south, longitude: west },
]

const centro: CoverageZone = { id: 'z1', code: 'ZC', name: 'Zona Centro', ring: square(-0.1, -0.3, -78.4, -78.6), holes: [] }

describe('zoneCovering', () => {
  it('devuelve la zona que contiene el punto', () => {
    expect(zoneCovering({ latitude: -0.2, longitude: -78.5 }, [centro])?.id).toBe('z1')
  })

  it('devuelve null si el punto cae fuera de todas las zonas', () => {
    expect(zoneCovering({ latitude: 40.4, longitude: -3.7 }, [centro])).toBeNull()
    expect(zoneCovering({ latitude: -0.2, longitude: -78.5 }, [])).toBeNull()
  })

  it('el borde cuenta como cubierto, igual que la clasificación del backend', () => {
    expect(zoneCovering({ latitude: -0.1, longitude: -78.5 }, [centro])?.id).toBe('z1')
    expect(zoneCovering({ latitude: -0.2, longitude: -78.6 }, [centro])?.id).toBe('z1')
  })

  it('el interior de un hueco no está cubierto, pero su borde sí', () => {
    const donut: CoverageZone = { ...centro, holes: [square(-0.18, -0.22, -78.48, -78.52)] }
    expect(zoneCovering({ latitude: -0.2, longitude: -78.5 }, [donut])).toBeNull()
    expect(zoneCovering({ latitude: -0.15, longitude: -78.5 }, [donut])?.id).toBe('z1')
    expect(zoneCovering({ latitude: -0.18, longitude: -78.5 }, [donut])?.id).toBe('z1')
  })

  it('con zonas que se solapan devuelve la primera', () => {
    const otra: CoverageZone = { ...centro, id: 'z2', name: 'Otra' }
    expect(zoneCovering({ latitude: -0.2, longitude: -78.5 }, [otra, centro])?.id).toBe('z2')
  })
})

describe('parseCoverageZones', () => {
  const coord = { latitude: -0.2, longitude: -78.5 }

  it('lee zonas con y sin huecos', () => {
    const zones = parseCoverageZones({
      zones: [
        { id: 'a', code: 'A', name: 'Zona A', ring: [coord, coord, coord] },
        { id: 'b', code: 'B', name: 'Zona B', ring: [coord, coord, coord], holes: [[coord, coord, coord]] },
      ],
    })

    expect(zones.map((z) => z.id)).toEqual(['a', 'b'])
    expect(zones[0]?.holes).toEqual([])
    expect(zones[1]?.holes).toHaveLength(1)
  })

  it('acepta holes en null', () => {
    expect(parseCoverageZones({ zones: [{ id: 'a', code: 'A', name: 'A', ring: [coord, coord, coord], holes: null }] })[0]?.holes).toEqual([])
  })

  it('rechaza formas inválidas', () => {
    expect(() => parseCoverageZones(null)).toThrow()
    expect(() => parseCoverageZones({ zones: 'no' })).toThrow()
    expect(() => parseCoverageZones({ zones: [{ id: 'a', code: 'A', name: 'A', ring: [{ latitude: 'x', longitude: 1 }] }] })).toThrow()
    expect(() => parseCoverageZones({ zones: [{ id: 'a', code: 'A', name: 'A' }] })).toThrow()
  })
})

describe('parsePhotonFeatures', () => {
  const feature = (properties: Record<string, unknown>, coordinates: unknown = [-78.5, -0.2]) => ({
    geometry: { type: 'Point', coordinates },
    properties,
  })

  it('arma nombre, dirección y coordenadas (GeoJSON va como [longitud, latitud])', () => {
    const [place] = parsePhotonFeatures({
      features: [feature({ name: 'Av. Central', street: 'Av. Central', housenumber: '123', district: 'Centro', city: 'Quito', country: 'Ecuador' })],
    })

    expect(place).toEqual({ name: 'Av. Central', address: 'Av. Central 123, Centro, Quito, Ecuador', latitude: -0.2, longitude: -78.5 })
  })

  it('sin nombre usa calle y número, y no repite partes en la dirección', () => {
    const [place] = parsePhotonFeatures({ features: [feature({ street: 'Calle 9', housenumber: '4', city: 'Quito', country: 'Quito' })] })

    expect(place?.name).toBe('Calle 9 4')
    expect(place?.address).toBe('Quito')
  })

  it('descarta entradas incompletas', () => {
    const places = parsePhotonFeatures({
      features: [feature({}), feature({ name: 'Sin coordenadas' }, []), { geometry: null, properties: {} }, feature({ name: 'Válida' })],
    })

    expect(places.map((p) => p.name)).toEqual(['Válida'])
  })

  it('rechaza una respuesta que no es de Photon', () => {
    expect(() => parsePhotonFeatures({})).toThrow()
    expect(() => parsePhotonFeatures(null)).toThrow()
  })
})
