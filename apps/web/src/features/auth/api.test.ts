import { describe, expect, it } from 'vitest'
import { apiError, mockApi, sentBody } from '@/test/utils'
import { signup } from './api'

const customer = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'cliente@example.com',
  fullName: 'Carla Cliente',
  role: 'CUSTOMER',
  active: true,
  createdAt: '2026-10-11T00:00:00Z',
}

describe('signup', () => {
  it('envía el cuerpo al endpoint público y parsea la sesión', async () => {
    const fetchMock = mockApi(() => ({
      status: 201,
      body: { accessToken: 'tok-new', tokenType: 'Bearer', expiresIn: 3600, user: customer },
    }))

    const result = await signup({ email: 'cliente@example.com', password: 'clave-segura', fullName: 'Carla Cliente', phone: '0991234567', city: 'Quito' })

    expect(result.accessToken).toBe('tok-new')
    expect(result.user.role).toBe('CUSTOMER')
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url?.endsWith('/api/v1/auth/signup')).toBe(true)
    expect(init?.method).toBe('POST')
    expect(sentBody(init)).toEqual({ email: 'cliente@example.com', password: 'clave-segura', fullName: 'Carla Cliente', phone: '0991234567', city: 'Quito' })
  })

  it('propaga el conflicto por correo duplicado', async () => {
    mockApi(() => apiError(409, 'CONFLICT', 'email already registered'))
    await expect(signup({ email: 'a@b.co', password: '12345678', fullName: 'A', phone: '0991234567', city: 'Quito' })).rejects.toMatchObject({ status: 409 })
  })
})
