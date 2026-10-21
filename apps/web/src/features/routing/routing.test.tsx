import { screen, waitFor, within } from '@testing-library/react'
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
    if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') return response
    return { status: 200, body: [] }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

/** The Gateway response shape for POST /api/v1/routes/plan, built from an in-memory plan. */
function asBackend(p: RoutePlan) {
  return {
    planId: p.id,
    unassignedOrderIds: p.unassignedOrderIds,
    routes: p.routes.map((r) => ({
      routeId: r.id,
      driverId: r.driverId,
      driverName: r.driverName,
      orderCount: r.stops.length,
      stops: r.stops,
    })),
  }
}

describe('generar rutas', () => {
  it('genera el plan y muestra cada ruta con sus paradas en orden', async () => {
    mockGenerate({ status: 200, body: asBackend(plan) })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))

    expect(await screen.findByRole('heading', { name: 'Luis Andrade' })).toBeTruthy()
    expect(screen.getByText('Calle Juan León Mera 1224')).toBeTruthy()
    const pending = screen.getByRole('region', { name: 'Pedidos sin repartidor' })
    expect(within(pending).getByText('Pedido o-9')).toBeTruthy()
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

describe('pedido de último momento y ajustes', () => {
  const twoRoutes: RoutePlan = {
    ...plan,
    unassignedOrderIds: [],
    routes: [...plan.routes, { id: 'route-2', driverId: 'd-2', driverName: 'María Paredes', stops: [] }],
  }

  it('asigna un pedido sin repartidor a una ruta y lo quita de la lista de pendientes', async () => {
    const updated: RoutePlan = {
      ...plan,
      routes: plan.routes.map((route) => (route.id === 'route-1'
        ? { ...route, stops: [...route.stops, { orderId: 'o-9', address: 'Pedido o-9', sequence: 3 }] }
        : route)),
      unassignedOrderIds: [],
    }
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') return { status: 200, body: asBackend(plan) }
      if (url.endsWith('/api/v1/route-plans/plan-1/stops') && init.method === 'POST') return { status: 200, body: updated }
      return { status: 200, body: [] }
    })
    const user = userEvent.setup()
    renderApp('/routes')
    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))
    await user.click(await screen.findByRole('button', { name: 'Asignar' }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Asignar' })).toBeNull()
    })
    expect(screen.queryByRole('region', { name: 'Pedidos sin repartidor' })).toBeNull()
  })

  it('explica el conflicto cuando otro proceso cambió el plan al mover una parada (409)', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') return { status: 200, body: asBackend(twoRoutes) }
      if (url.includes('/stops/o-1') && init.method === 'PATCH') return { status: 409, body: { error: { code: 'CONFLICT', message: 'x' } } }
      return { status: 200, body: [] }
    })
    const user = userEvent.setup()
    renderApp('/routes')
    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))
    const moves = await screen.findAllByRole('button', { name: 'Mover' })
    await user.click(moves[0] as HTMLElement)

    expect(await screen.findByRole('alert')).toHaveTextContent('Otro proceso cambió el plan')
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
