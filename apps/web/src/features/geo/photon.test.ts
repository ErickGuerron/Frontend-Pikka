import { describe, expect, it } from 'vitest'
import { parsePhotonFeatures } from './photon'

const feature = (properties: Record<string, unknown>, coordinates: unknown = [-78.4678, -0.1807]) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates },
  properties,
})

describe('parsePhotonFeatures', () => {
  it('convierte coordenadas GeoJSON [lng, lat] a latitud y longitud', () => {
    const [place] = parsePhotonFeatures({ type: 'FeatureCollection', features: [feature({ name: 'Parque' })] })
    expect(place).toMatchObject({ latitude: -0.1807, longitude: -78.4678 })
  })

  it('arma la dirección con calle, número, barrio, ciudad y país', () => {
    const [place] = parsePhotonFeatures({
      features: [feature({ street: 'Av. Amazonas', housenumber: '123', district: 'La Mariscal', city: 'Quito', country: 'Ecuador' })],
    })
    expect(place?.name).toBe('Av. Amazonas 123')
    expect(place?.address).toBe('La Mariscal, Quito, Ecuador')
  })

  it('usa el nombre del lugar cuando existe y no lo repite en la dirección', () => {
    const [place] = parsePhotonFeatures({
      features: [feature({ name: 'Mercado Central', street: 'Calle Sucre', city: 'Quito', country: 'Ecuador' })],
    })
    expect(place?.name).toBe('Mercado Central')
    expect(place?.address).toBe('Calle Sucre, Quito, Ecuador')
  })

  it('descarta resultados sin coordenadas válidas o sin nombre', () => {
    const places = parsePhotonFeatures({
      features: [feature({ name: 'Sin coords' }, 'no-es-lista'), feature({}), feature({ name: 'Ok' })],
    })
    expect(places.map((p) => p.name)).toEqual(['Ok'])
  })

  it('rechaza una respuesta sin lista de resultados', () => {
    expect(() => parsePhotonFeatures({ error: 'boom' })).toThrow('photon: expected features array')
    expect(() => parsePhotonFeatures(null)).toThrow()
  })

  it('acepta una respuesta vacía', () => {
    expect(parsePhotonFeatures({ features: [] })).toEqual([])
  })
})
