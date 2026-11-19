import { describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/utils'
import { ApiError, userMessage } from './errors'
import { createHttpClient } from './http'

const identity = (d: unknown) => d

describe('createHttpClient', () => {
  it('envía el token y el cuerpo JSON', async () => {
    const fetchMock = mockApi(() => ({ status: 200, body: { ok: true } }))
    const client = createHttpClient({ baseUrl: 'http://gw', getToken: () => 'tok', onUnauthorized: vi.fn() })

    await expect(client.post('/api/v1/x', identity, { body: { a: 1 } })).resolves.toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('http://gw/api/v1/x')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok', 'Content-Type': 'application/json' })
    expect(init?.body).toBe('{"a":1}')
  })

  it('convierte el formato de error del Gateway en ApiError', async () => {
    mockApi(() => ({ status: 409, body: { error: { code: 'CONFLICT', message: 'email already registered', requestId: 'r-9' } } }))
    const client = createHttpClient({ baseUrl: '', getToken: () => null, onUnauthorized: vi.fn() })

    const error = await client.get('/x', identity).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'CONFLICT', requestId: 'r-9' })
    expect(userMessage(error)).toBe('Ya existe un registro con esos datos.')
  })

  it('cierra la sesión ante un 401 con token, pero no en un login fallido', async () => {
    mockApi(() => ({ status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'x' } } }))
    const onUnauthorized = vi.fn()

    const anonymous = createHttpClient({ baseUrl: '', getToken: () => null, onUnauthorized })
    await anonymous.post('/login', identity).catch(() => undefined)
    expect(onUnauthorized).not.toHaveBeenCalled()

    const authed = createHttpClient({ baseUrl: '', getToken: () => 'expired', onUnauthorized })
    await authed.get('/me', identity).catch(() => undefined)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('reporta errores de red como NETWORK', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    const client = createHttpClient({ baseUrl: '', getToken: () => null, onUnauthorized: vi.fn() })
    await expect(client.get('/x', identity)).rejects.toMatchObject({ code: 'NETWORK' })
  })
})

describe('respuestas sin cuerpo del Gateway', () => {
  it('trata un 502 sin JSON como backend no disponible', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 502 }))))
    const client = createHttpClient({ baseUrl: '', getToken: () => null, onUnauthorized: vi.fn() })
    const error = await client.post('/api/v1/auth/login', identity).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 502, code: 'UPSTREAM_UNAVAILABLE' })
    expect(userMessage(error)).toBe('No se pudo conectar con el backend. Revisa que el API Gateway esté corriendo.')
  })
})
