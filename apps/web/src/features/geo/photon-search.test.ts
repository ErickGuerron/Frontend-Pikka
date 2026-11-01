import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PHOTON_URL, reversePlace, searchPlaces } from './api'

const feature = {
  geometry: { type: 'Point', coordinates: [-78.48, -0.18] },
  properties: { name: 'Av. Amazonas', city: 'Quito', country: 'Ecuador' },
}

function photonReply(features: unknown[], status = 200) {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify({ features }), { status })))
}

/** URL con la que el código llamó a fetch en la primera petición. */
function firstRequestUrl(): string {
  const input = vi.mocked(fetch).mock.calls[0]?.[0]
  if (typeof input !== 'string') throw new Error('se esperaba una URL de texto')
  return input
}

beforeEach(() => {
  vi.stubGlobal('fetch', photonReply([feature]))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('búsqueda de lugares con Photon', () => {
  it('consulta la búsqueda pública con la consulta codificada y el límite de resultados', async () => {
    const places = await searchPlaces('Av. Amazonas & 6')

    expect(firstRequestUrl()).toBe(`${PHOTON_URL}/api/?q=${encodeURIComponent('Av. Amazonas & 6')}&limit=5`)
    expect(places).toEqual([{ name: 'Av. Amazonas', address: 'Quito, Ecuador', latitude: -0.18, longitude: -78.48 }])
  })

  it('pide JSON y no envía credenciales de la sesión al servicio externo', async () => {
    await searchPlaces('Quito')

    const init = vi.mocked(fetch).mock.calls[0]?.[1]
    expect(init?.headers).toEqual({ Accept: 'application/json' })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('una respuesta con error HTTP se rechaza con el código recibido', async () => {
    vi.stubGlobal('fetch', photonReply([], 502))

    await expect(searchPlaces('Quito')).rejects.toThrow('geocoder HTTP 502')
  })
})

describe('lugar más cercano a una coordenada', () => {
  it('devuelve el primer lugar de Photon con las coordenadas consultadas', async () => {
    const place = await reversePlace(-0.2, -78.5)

    expect(firstRequestUrl()).toBe(`${PHOTON_URL}/reverse?lat=-0.2&lon=-78.5&limit=1`)
    expect(place).toEqual({ name: 'Av. Amazonas', address: 'Quito, Ecuador', latitude: -0.18, longitude: -78.48 })
  })

  it('devuelve null cuando Photon no encuentra ningún lugar', async () => {
    vi.stubGlobal('fetch', photonReply([]))

    expect(await reversePlace(-0.2, -78.5)).toBeNull()
  })
})
