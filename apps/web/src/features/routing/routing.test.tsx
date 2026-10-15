import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { ApiError } from '@/shared/api/errors'
import { adminUser, mockApi, renderApp } from '@/test/utils'
import { routingErrorMessage } from './api'
import { parseRoutePlan, type RoutePlan } from './types'

const plan: RoutePlan = {
  id: 'plan-1',
  routes: [
    {
      id: 'route-1',
      driverId: 'd-1',
      driverName: 'Luis Andrade',
      stops: [
        { orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1 },
        { orderId: 'o-2', address: 'Calle Juan León Mera 1224', sequence: 2 },
      ],
    },
  ],
  unassignedOrderIds: ['o-9'],
}

function mockGenerate(response: { status: number; body: unknown }) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    if (url.endsWith('/api/v1/route-plans/generate') && init.method === 'POST') return response
    return { status: 200, body: [] }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('generar rutas', () => {
  it('genera el plan y muestra cada ruta con sus paradas en orden', async () => {
    mockGenerate({ status: 200, body: plan })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))

    expect(await screen.findByRole('heading', { name: 'Luis Andrade' })).toBeTruthy()
    expect(screen.getByText('Calle Juan León Mera 1224')).toBeTruthy()
    expect(screen.getByText(/1 pedido\(s\) sin repartidor/)).toBeTruthy()
  })

  it('explica el conflicto cuando otro proceso asignó al mismo tiempo (409)', async () => {
    mockGenerate({ status: 409, body: { error: { code: 'CONFLICT', message: 'conflict' } } })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Otro proceso está asignando repartidores')
  })

  it('avisa que el servicio no está disponible cuando el endpoint no existe', async () => {
    mockGenerate({ status: 404, body: { error: { code: 'NOT_FOUND', message: 'not found' } } })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('El servicio de rutas aún no está disponible.'))
  })
})

describe('reglas de rutas', () => {
  it('valida la forma del plan recibido', () => {
    expect(parseRoutePlan(plan)).toEqual(plan)
    expect(() => parseRoutePlan({ id: 'x', routes: 'no-es-lista', unassignedOrderIds: [] })).toThrow(RangeError)
  })

  it('traduce los errores a mensajes para el operador', () => {
    expect(routingErrorMessage(new ApiError(409, 'CONFLICT', 'conflict'))).toContain('al mismo tiempo')
    expect(routingErrorMessage(new ApiError(503, 'UNAVAILABLE', 'down'))).toBe('El servicio de rutas aún no está disponible.')
  })
})
