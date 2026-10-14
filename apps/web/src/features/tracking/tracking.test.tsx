import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, mockApi, renderApp } from '@/test/utils'
import { openStops, parseTrackedRoutes, type TrackedRoute } from './types'

const routes: TrackedRoute[] = [
  {
    id: 'route-1',
    driverName: 'Luis Andrade',
    stops: [
      { orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1, status: 'DELIVERED' },
      { orderId: 'o-2', address: 'Calle Juan León Mera 1224', sequence: 2, status: 'IN_TRANSIT' },
    ],
  },
]

function mockSnapshot(response: { status: number; body: unknown }) {
  return mockApi((url) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    if (url.endsWith('/api/v1/tracking/routes/active')) return response
    return { status: 200, body: [] }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('seguimiento de rutas', () => {
  it('muestra el estado de cada parada de las rutas en curso', async () => {
    mockSnapshot({ status: 200, body: routes })
    renderApp('/tracking')

    const card = await screen.findByRole('heading', { name: 'Luis Andrade' })
    const article = card.closest('article')
    expect(article).not.toBeNull()
    const list = within(article as HTMLElement)
    expect(list.getByText('Entregado')).toBeTruthy()
    expect(list.getByText('En camino')).toBeTruthy()
    expect(list.getByText(/1 paradas abiertas/)).toBeTruthy()
  })

  it('avisa cuando no hay rutas en curso', async () => {
    mockSnapshot({ status: 200, body: [] })
    renderApp('/tracking')

    await waitFor(() => {
      expect(screen.getByText('No hay rutas en curso.')).toBeTruthy()
    })
  })

  it('muestra el error con reintento cuando el servicio no responde', async () => {
    mockSnapshot({ status: 404, body: { error: { code: 'NOT_FOUND', message: 'not found' } } })
    renderApp('/tracking')

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })
})

describe('reglas de seguimiento', () => {
  it('cuenta como abiertas las paradas sin resultado final', () => {
    expect(openStops(routes[0] as TrackedRoute)).toBe(1)
  })

  it('rechaza un estado de parada que no existe', () => {
    expect(() => parseTrackedRoutes([{ id: 'r', driverName: 'X', stops: [{ orderId: 'o', address: 'a', sequence: 1, status: 'LOST' }] }])).toThrow(RangeError)
  })
})
