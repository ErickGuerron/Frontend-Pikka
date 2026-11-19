import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, mockApi, renderApp } from '@/test/utils'
import { countStops, lastRevealedOrderId, revealConfig, revealedRoutes } from './reveal'
import { asBackend, buildRoutePlan, luisRoute, pendingOrder } from './routing.fixtures'
import type { RoutePlan } from './types'

const maria = { id: 'route-2', driverId: 'd-2', driverName: 'María', stops: [{ orderId: 'o-3', address: 'Calle C', sequence: 1 }] }
const plan: RoutePlan = buildRoutePlan([luisRoute, maria], [])

describe('revealedRoutes', () => {
  it('muestra las primeras paradas ruta por ruta y oculta las rutas que aún no empiezan', () => {
    expect(revealedRoutes(plan, 1).map((r) => [r.id, r.stops.length])).toEqual([['route-1', 1]])
    expect(revealedRoutes(plan, 2).map((r) => [r.id, r.stops.length])).toEqual([['route-1', 2]])
    expect(revealedRoutes(plan, 3).map((r) => [r.id, r.stops.length])).toEqual([['route-1', 2], ['route-2', 1]])
  })

  it('devuelve el plan completo con null y nada con 0', () => {
    expect(revealedRoutes(plan, null)).toBe(plan.routes)
    expect(revealedRoutes(plan, 0)).toEqual([])
  })

  it('cuenta las paradas y señala la última visible', () => {
    expect(countStops(plan)).toBe(3)
    expect(lastRevealedOrderId(revealedRoutes(plan, 2))).toBe('o-2')
    expect(lastRevealedOrderId([])).toBeNull()
  })
})

describe('generar rutas con revelado paso a paso', () => {
  beforeEach(() => {
    useSession.getState().setToken('tok')
    revealConfig.delayMs = 60
  })
  afterEach(() => {
    revealConfig.delayMs = 0
  })

  it('agrega las paradas una a una y al final muestra el plan completo', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/orders')) return { status: 200, body: [pendingOrder('n-1', '2026-11-18')] }
      if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') return { status: 200, body: asBackend(plan) }
      return { status: 200, body: [] }
    })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: /Crear rutas/ }))

    // First tick: only the first stop is on screen and the status says how far the build is.
    expect(await screen.findByText('Av. Amazonas N24-03')).toBeTruthy()
    expect(screen.queryByText('Calle C')).toBeNull()
    expect(screen.getByText(/Armando las rutas/)).toHaveTextContent('parada 1 de 3')
    // Confirming is blocked while the proposal is still being built.
    expect(screen.getByRole('button', { name: 'Confirmar y asignar' })).toBeDisabled()

    // At the end everything is shown, the status is gone and the proposal can be confirmed.
    expect(await screen.findByText('Calle C')).toBeTruthy()
    await waitFor(() => { expect(screen.queryByText(/Armando las rutas/)).toBeNull() })
    expect(screen.getByText('Calle Juan León Mera 1224')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Confirmar y asignar' })).toBeEnabled()
  })
})
