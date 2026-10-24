import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PHOTON_TIMEOUT_MS, reversePlace, reverseStreetPlace } from './api'

/** Fetch que nunca responde, salvo que la peticiÃ³n se cancele por su seÃ±al. */
function hangingFetch(_url: string, init: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => {
      reject(new DOMException('aborted', 'AbortError'))
    })
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn(hangingFetch))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('geocodificaciÃ³n con Photon', () => {
  it('cancela la peticiÃ³n cuando pasa el tiempo lÃ­mite', async () => {
    const lookup = reversePlace(-0.2, -78.5)
    const rejected = expect(lookup).rejects.toThrow()

    await vi.advanceTimersByTimeAsync(PHOTON_TIMEOUT_MS)

    await rejected
  })

  it('tambiÃ©n respeta la cancelaciÃ³n del llamante antes del tiempo lÃ­mite', async () => {
    const caller = new AbortController()
    const lookup = reversePlace(-0.2, -78.5, caller.signal)
    const rejected = expect(lookup).rejects.toThrow()

    caller.abort()

    await rejected
  })
})

describe('direccion con calles (Photon, solo vias)', () => {
  it('pide solo vias y devuelve la calle con su ciudad', async () => {
    const body = {
      features: [
        { geometry: { type: 'Point', coordinates: [-78.62, -1.24005] }, properties: { name: 'Av. Cevallos', city: 'Ambato', country: 'Ecuador' } },
      ],
    }
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))))

    const place = await reverseStreetPlace(-1.24, -78.62)

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('osm_tag=highway')
    expect(place?.name).toBe('Av. Cevallos')
    expect(place?.address).toBe('Av. Cevallos, Ambato, Ecuador')
    expect(place?.latitude).toBe(-1.24)
  })

  it('sin vias cercanas no devuelve la ciudad', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ features: [] }), { status: 200 }))))

    expect(await reverseStreetPlace(-1.24, -78.62)).toBeNull()
  })
})