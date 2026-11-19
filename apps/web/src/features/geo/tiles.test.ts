import { describe, expect, it } from 'vitest'
import { mapTileSource } from './tiles'

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

describe('mapTileSource', () => {
  it('sin clave usa OpenStreetMap con su atribucion', () => {
    const source = mapTileSource(undefined)

    expect(source.url).toBe(OSM_URL)
    expect(source.attribution).toContain('OpenStreetMap')
  })

  it('una clave vacia o solo con espacios cuenta como sin clave', () => {
    expect(mapTileSource('   ').url).toBe(OSM_URL)
    expect(mapTileSource('').url).toBe(OSM_URL)
  })

  it('con clave usa MapTiler sin espacios y conserva la atribucion de OpenStreetMap', () => {
    const source = mapTileSource(' abc123 ')

    expect(source.url).toBe('https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=abc123')
    expect(source.attribution).toContain('MapTiler')
    expect(source.attribution).toContain('OpenStreetMap')
  })
})
