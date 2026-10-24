import { describe, expect, it } from 'vitest'
import { streetAddressFrom } from './street-address'
import type { Place } from './photon'

const point = { latitude: -1.24, longitude: -78.62 }

// Coordenadas a ~5 m, ~20 m y ~400 m del punto (1 grado de latitud ~ 111 km).
const near = { latitude: -1.24005, longitude: -78.62 }
const crossing = { latitude: -1.24018, longitude: -78.62 }
const far = { latitude: -1.2436, longitude: -78.62 }

const street = (name: string, at: { latitude: number; longitude: number }): Place => ({
  name,
  address: 'Ambato, Ecuador',
  latitude: at.latitude,
  longitude: at.longitude,
})

describe('streetAddressFrom (web)', () => {
  it('nombra la calle mas cercana con su ciudad y pais', () => {
    expect(streetAddressFrom([street('Av. Cevallos', near)], point)).toBe('Av. Cevallos, Ambato, Ecuador')
  })

  it('nombra el cruce cuando otra calle distinta esta a menos de 100 m', () => {
    const streets = [street('Av. Cevallos', near), street('Calle Sucre', crossing)]
    expect(streetAddressFrom(streets, point)).toBe('Av. Cevallos y Calle Sucre, Ambato, Ecuador')
  })

  it('no inventa cruce con una calle lejana', () => {
    const streets = [street('Av. Cevallos', near), street('Calle Lejana', far)]
    expect(streetAddressFrom(streets, point)).toBe('Av. Cevallos, Ambato, Ecuador')
  })

  it('devuelve null sin calles: no se autollena con la ciudad', () => {
    expect(streetAddressFrom([], point)).toBeNull()
  })
})
