import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { pendingOrder } from '@/features/routing/routing.fixtures'
import { adminUser, mockApi, renderApp } from '@/test/utils'
import { SNAPSHOT_INTERVAL_MS } from './api'
import { agoLabel } from './ago'
import { parseTrackedRoutes } from './types'

const withPosition = {
  id: 'route-1',
  driverName: 'Luis Andrade',
  driverPosition: { latitude: -0.18, longitude: -78.47, recordedAt: '2026-11-18T12:00:00Z' },
  stops: [{ orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1, status: 'IN_TRANSIT' }],
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('posición del repartidor', () => {
  it('se lee cuando viene y se omite cuando no hay posición reciente', () => {
    const [route] = parseTrackedRoutes([withPosition])
    expect(route?.driverPosition).toEqual(withPosition.driverPosition)

    const [bare] = parseTrackedRoutes([{ ...withPosition, driverPosition: undefined }])
    expect(bare).not.toHaveProperty('driverPosition')
  })

  it('rechaza una posición sin coordenadas', () => {
    expect(() => parseTrackedRoutes([{ ...withPosition, driverPosition: { latitude: '-0.18', longitude: -78.4, recordedAt: 'x' } }])).toThrow(RangeError)
  })
})

describe('agoLabel', () => {
  const at = '2026-11-18T12:00:00Z'
  const later = (seconds: number) => new Date(at).getTime() + seconds * 1000

  it('dice qué tan vieja es la posición en segundos, minutos u horas', () => {
    expect(agoLabel(at, later(12))).toBe('hace 12 s')
    expect(agoLabel(at, later(59))).toBe('hace 59 s')
    expect(agoLabel(at, later(180))).toBe('hace 3 min')
    expect(agoLabel(at, later(2 * 3600 + 5))).toBe('hace 2 h')
  })

  it('una hora futura (reloj desfasado) no da un número negativo, y una fecha inválida se dice', () => {
    expect(agoLabel(at, later(-30))).toBe('hace 0 s')
    expect(agoLabel('no-es-fecha', later(5))).toBe('sin hora')
  })
})

describe('seguimiento con mapa', () => {
  function mockTracking() {
    const calls = { active: 0 }
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/orders')) return { status: 200, body: [{ ...pendingOrder('o-1', '2026-11-18'), status: 'IN_TRANSIT' }] }
      if (url.endsWith('/api/v1/tracking/routes/active')) {
        calls.active += 1
        return { status: 200, body: [withPosition] }
      }
      return { status: 200, body: [] }
    })
    return calls
  }

  it('dibuja el mapa de seguimiento cuando hay paradas o un repartidor con posición', async () => {
    mockTracking()
    renderApp('/tracking')

    expect(await screen.findByRole('region', { name: 'Mapa de seguimiento' })).toBeTruthy()
  })

  it('se actualiza cada 3 minutos y el botón Actualizar vuelve a pedir el estado', async () => {
    const calls = mockTracking()
    const user = userEvent.setup()
    renderApp('/tracking')
    await screen.findByText('Av. Amazonas N24-03')
    expect(calls.active).toBe(1)
    expect(SNAPSHOT_INTERVAL_MS).toBe(3 * 60 * 1000)
    expect(screen.getByText(/cada 3 minutos/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))

    await waitFor(() => { expect(calls.active).toBe(2) })
  })
})

describe('ver solo una ruta', () => {
  const second = {
    id: 'route-2',
    driverName: 'María Paredes',
    stops: [{ orderId: 'o-2', address: 'Calle Juan León Mera 1224', sequence: 1, status: 'PENDING' }],
  }

  function mockTwoRoutes() {
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/tracking/routes/active')) return { status: 200, body: [withPosition, second] }
      return { status: 200, body: [] }
    })
  }

  it('elegir un repartidor deja solo su ruta y Ver todas las rutas las devuelve', async () => {
    mockTwoRoutes()
    const user = userEvent.setup()
    renderApp('/tracking')
    expect(await screen.findByRole('heading', { name: 'María Paredes' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Luis Andrade' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ver solo la ruta de María Paredes' }))

    expect(screen.queryByRole('heading', { name: 'Luis Andrade' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'María Paredes' })).toBeTruthy()
    expect(screen.getByText(/Mostrando solo la ruta de/)).toHaveTextContent('María Paredes')
    expect(screen.queryByRole('button', { name: /Ver solo la ruta de/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Ver todas las rutas' }))

    expect(screen.getByRole('heading', { name: 'Luis Andrade' })).toBeTruthy()
    expect(screen.queryByText(/Mostrando solo la ruta de/)).toBeNull()
  })
})
