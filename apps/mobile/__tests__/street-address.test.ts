import { streetAddressFrom } from '../src/features/customer-orders/map/street-address'
import type { Place } from '../src/features/customer-orders/map/photon'

const point = { latitude: -1.2400, longitude: -78.6200 }

// Coordenadas dentro de ~5 m, ~20 m y ~400 m del punto (1 grado de latitud ~ 111 km).
const near = { latitude: -1.24005, longitude: -78.62000 }
const crossing = { latitude: -1.24018, longitude: -78.62000 }
const far = { latitude: -1.2436, longitude: -78.62 }

const street = (name: string, at: { latitude: number; longitude: number }): Place => ({
  name,
  address: 'Ambato, Ecuador',
  latitude: at.latitude,
  longitude: at.longitude,
})

describe('streetAddressFrom', () => {
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

  it('no toma el mismo nombre dos veces como cruce', () => {
    const streets = [street('Av. Cevallos', near), street('Av. Cevallos', crossing)]
    expect(streetAddressFrom(streets, point)).toBe('Av. Cevallos, Ambato, Ecuador')
  })

  it('devuelve null cuando no hay calles: no se autollena con la ciudad', () => {
    expect(streetAddressFrom([], point)).toBeNull()
  })
})
