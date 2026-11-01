import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { userMessage } from '@/shared/api/errors'
import { adminUser, mockApi, renderApp, sentBody } from '@/test/utils'
import { routingErrorMessage } from './api'
import { generateDemoRoutePlan } from './demo'
import { asBackend, buildRoutePlan, luisRoute } from './routing.fixtures'
import { parseRoutePlan } from './types'

const plan = buildRoutePlan([
  luisRoute,
  { id: 'route-2', driverId: 'd-2', driverName: 'María Paredes', stops: [] },
  { id: 'route-3', driverId: 'd-3', driverName: 'Jorge Vélez', stops: [] },
])

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('rutas: mover paradas y asignar pedidos', () => {
  it('mover una parada envía la ruta elegida en el selector', async () => {
    const patches: Array<{ url: string; body: unknown }> = []
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') return { status: 200, body: asBackend(plan) }
      if (url.includes('/stops/') && init.method === 'PATCH') {
        patches.push({ url, body: sentBody(init) })
        return { status: 200, body: plan }
      }
      return { status: 200, body: [] }
    })
    renderApp('/routes')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))

    await user.selectOptions(await screen.findByLabelText('Mover el pedido o-1 a'), 'route-3')
    await user.click(screen.getAllByRole('button', { name: 'Mover' })[0] as HTMLElement)

    await waitFor(() => { expect(patches).toHaveLength(1) })
    expect(patches[0]?.url).toMatch(/\/stops\/o-1$/)
    expect(JSON.stringify(patches[0]?.body)).toContain('route-3')
  })

  it('asignar un pedido sin repartidor usa la ruta elegida en su selector', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') return { status: 200, body: asBackend(plan) }
      return { status: 200, body: [] }
    })
    renderApp('/routes')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Generar rutas' }))
    const pending = await screen.findByRole('region', { name: 'Pedidos sin repartidor' })

    const select = within(pending).getByLabelText('Asignar el pedido o-9 a')
    await user.selectOptions(select, 'route-2')

    expect(select).toHaveValue('route-2')
  })
})

describe('rutas: errores y datos de muestra', () => {
  it('un error que no es de la API se traduce con el mensaje general', () => {
    const failure = new Error('boom')

    expect(routingErrorMessage(failure)).toBe(userMessage(failure))
  })

  it('el plan de muestra tiene dos rutas y un pedido sin asignar, y es un plan válido', async () => {
    const demo = await generateDemoRoutePlan()

    expect(parseRoutePlan(demo)).toEqual(demo)
    expect(demo.routes.map((route) => route.id)).toEqual(['route-1', 'route-2'])
    expect(demo.unassignedOrderIds).toEqual(['o-4'])
  })
})
