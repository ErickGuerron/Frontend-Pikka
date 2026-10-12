import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PHOTON_TIMEOUT_MS, reversePlace } from './api'

/** Fetch que nunca responde, salvo que la petición se cancele por su señal. */
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

describe('geocodificación con Photon', () => {
  it('cancela la petición cuando pasa el tiempo límite', async () => {
    const lookup = reversePlace(-0.2, -78.5)
    const rejected = expect(lookup).rejects.toThrow()

    await vi.advanceTimersByTimeAsync(PHOTON_TIMEOUT_MS)

    await rejected
  })

  it('también respeta la cancelación del llamante antes del tiempo límite', async () => {
    const caller = new AbortController()
    const lookup = reversePlace(-0.2, -78.5, caller.signal)
    const rejected = expect(lookup).rejects.toThrow()

    caller.abort()

    await rejected
  })
})
