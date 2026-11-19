import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { ApiError } from '@/shared/api/errors'
import { adminUser, mockApi, renderApp, sentBody } from '@/test/utils'
import { addOrderToRoute, routingErrorMessage } from './api'
import { asBackend, buildRoutePlan, luisRoute, pendingOrder, runningRoute } from './routing.fixtures'
import { parseAddedStop, parseRoutePlan } from './types'

const DAY = '2026-11-18'
const plan = buildRoutePlan([luisRoute], [])
const inProcess = runningRoute(`${DAY}-zona-1`, 'Camila Torres', [{ orderId: 'a-1', status: 'IN_TRANSIT' }, { orderId: 'a-2' }])

interface Backend {
  orders?: unknown[]
  active?: unknown[]
  planStatus?: number
  planBody?: unknown
  addStatus?: number
  addBody?: unknown
}

/** Records every plan request and add request so tests can tell a proposal from a real assignment. */
function mockBackend({ orders = [], active = [inProcess], planStatus = 200, planBody = asBackend(plan), addStatus = 201, addBody }: Backend = {}) {
  const planBodies: unknown[] = []
  const adds: Array<{ url: string; body: unknown }> = []
  mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    if (url.endsWith('/api/v1/orders')) return { status: 200, body: orders }
    if (url.endsWith('/api/v1/tracking/routes/active')) return { status: 200, body: active }
    if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') {
      planBodies.push(sentBody(init))
      return { status: planStatus, body: planBody }
    }
    if (url.includes('/api/v1/routes/') && url.endsWith('/orders') && init.method === 'POST') {
      adds.push({ url, body: sentBody(init) })
      return { status: addStatus, body: addBody ?? { routeId: `${DAY}-zona-1`, stop: { orderId: 'n-1', address: 'Calle n-1', sequence: 3 } } }
    }
    return { status: 200, body: [] }
  })
  return { planBodies, adds }
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('pantalla de rutas', () => {
  it('muestra las rutas en proceso y solo los pedidos pendientes como nuevos', async () => {
    mockBackend({ orders: [pendingOrder('n-1', DAY), { ...pendingOrder('x-1', DAY), status: 'ROUTE_ASSIGNED' }] })
    renderApp('/routes')

    const running = await screen.findByRole('region', { name: 'Rutas en proceso' })
    expect(await within(running).findByRole('heading', { name: 'Camila Torres' })).toBeTruthy()
    expect(within(running).getByText('En camino')).toBeTruthy()
    const fresh = await screen.findByRole('region', { name: 'Nuevos pedidos' })
    expect(await within(fresh).findByText('Calle n-1')).toBeTruthy()
    expect(within(fresh).queryByText('Calle x-1')).toBeNull()
  })

  it('sin rutas ni pedidos nuevos lo dice', async () => {
    mockBackend({ active: [] })
    renderApp('/routes')

    expect(await screen.findByText('No hay rutas en proceso.')).toBeTruthy()
    expect(await screen.findByText('No hay pedidos nuevos esperando ruta.')).toBeTruthy()
  })
})

describe('crear rutas con confirmación', () => {
  it('crear rutas solo propone: pide dryRun y no asigna nada hasta confirmar', async () => {
    const { planBodies } = mockBackend({ orders: [pendingOrder('n-1', DAY)] })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: /Crear rutas/ }))

    const proposal = await screen.findByRole('region', { name: 'Propuesta de rutas' })
    expect(within(proposal).getByText('Luis Andrade')).toBeTruthy()
    expect(within(proposal).getByText('Aún sin asignar')).toBeTruthy()
    expect(planBodies).toEqual([{ deliveryDate: DAY, dryRun: true }])
  })

  it('confirmar asigna de verdad (sin dryRun) y cierra la propuesta con un aviso', async () => {
    const { planBodies } = mockBackend({ orders: [pendingOrder('n-1', DAY)] })
    const user = userEvent.setup()
    renderApp('/routes')
    await user.click(await screen.findByRole('button', { name: /Crear rutas/ }))

    await user.click(await screen.findByRole('button', { name: 'Confirmar y asignar' }))

    await waitFor(() => { expect(screen.queryByRole('region', { name: 'Propuesta de rutas' })).toBeNull() })
    expect(await screen.findByText(/Rutas asignadas: 1/)).toBeTruthy()
    expect(planBodies).toEqual([{ deliveryDate: DAY, dryRun: true }, { deliveryDate: DAY }])
  })

  it('descartar cierra la propuesta sin haber asignado nada', async () => {
    const { planBodies } = mockBackend({ orders: [pendingOrder('n-1', DAY)] })
    const user = userEvent.setup()
    renderApp('/routes')
    await user.click(await screen.findByRole('button', { name: /Crear rutas/ }))

    await user.click(await screen.findByRole('button', { name: 'Descartar' }))

    expect(screen.queryByRole('region', { name: 'Propuesta de rutas' })).toBeNull()
    expect(planBodies).toHaveLength(1)
  })

  it('una ruta sin repartidor disponible impide confirmar y lo explica', async () => {
    const noDriver = { ...asBackend(plan), routes: asBackend(plan).routes.map((r) => ({ ...r, driverId: '', driverName: '' })) }
    mockBackend({ orders: [pendingOrder('n-1', DAY)], planBody: noDriver })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: /Crear rutas/ }))

    expect((await screen.findAllByText('Sin repartidor disponible')).length).toBeGreaterThan(0)
    expect(screen.getByRole('alert')).toHaveTextContent('no le queda un repartidor disponible')
    expect(screen.getByRole('button', { name: 'Confirmar y asignar' })).toBeDisabled()
  })

  it('si al confirmar ya no hay repartidor (422) lo explica y la propuesta sigue abierta', async () => {
    const calls: unknown[] = []
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/orders')) return { status: 200, body: [pendingOrder('n-1', DAY)] }
      if (url.endsWith('/api/v1/routes/plan') && init.method === 'POST') {
        calls.push(sentBody(init))
        return calls.length === 1
          ? { status: 200, body: asBackend(plan) }
          : { status: 422, body: { error: { code: 'FAILED_PRECONDITION', message: 'no driver available for route' } } }
      }
      return { status: 200, body: [] }
    })
    const user = userEvent.setup()
    renderApp('/routes')
    await user.click(await screen.findByRole('button', { name: /Crear rutas/ }))

    await user.click(await screen.findByRole('button', { name: 'Confirmar y asignar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay repartidores disponibles')
    expect(screen.getByRole('region', { name: 'Propuesta de rutas' })).toBeTruthy()
  })

  it('avisa que el servicio no está disponible al proponer (503)', async () => {
    mockBackend({ orders: [pendingOrder('n-1', DAY)], planStatus: 503, planBody: { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'down' } } })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: /Crear rutas/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El servicio de rutas aún no está disponible.')
  })
})

describe('agregar un pedido nuevo a una ruta en proceso', () => {
  it('lo envía a la ruta elegida y avisa la parada que le tocó', async () => {
    const { adds } = mockBackend({ orders: [pendingOrder('n-1', DAY)] })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: 'Agregar a ruta' }))

    expect(await screen.findByText(/Pedido agregado como parada 3/)).toBeTruthy()
    expect(adds).toHaveLength(1)
    expect(adds[0]?.url).toMatch(new RegExp(`/api/v1/routes/${DAY}-zona-1/orders$`))
    expect(adds[0]?.body).toEqual({ orderId: 'n-1' })
  })

  it('solo ofrece las rutas del mismo día y, sin ninguna, lo dice', async () => {
    mockBackend({ orders: [pendingOrder('n-1', '2026-11-25')] })
    renderApp('/routes')

    expect(await screen.findByText('Sin ruta en proceso ese día')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Agregar a ruta' })).toBeNull()
  })

  it('explica por qué la ruta lo rechazó cuando está llena (422)', async () => {
    mockBackend({
      orders: [pendingOrder('n-1', DAY)],
      addStatus: 422,
      addBody: { error: { code: 'FAILED_PRECONDITION', message: 'route is at its maximum capacity' } },
    })
    const user = userEvent.setup()
    renderApp('/routes')

    await user.click(await screen.findByRole('button', { name: 'Agregar a ruta' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'No se puede agregar a la ruta' })
    expect(dialog).toHaveTextContent('La ruta ya está llena')

    await user.click(within(dialog).getByRole('button', { name: 'Entendido' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})

describe('reglas de rutas', () => {
  it('valida la forma del plan y de la parada agregada', () => {
    expect(parseRoutePlan(plan)).toEqual(plan)
    expect(() => parseRoutePlan({ id: 'x', routes: 'no-es-lista', unassignedOrderIds: [] })).toThrow(RangeError)
    expect(parseAddedStop({ routeId: 'r', stop: { orderId: 'o', address: 'a', sequence: 4 } }).stop.sequence).toBe(4)
    expect(() => parseAddedStop({ routeId: 'r', stop: { orderId: 'o', address: 'a', sequence: '4' } })).toThrow(RangeError)
  })

  it('traduce los errores a mensajes para el operador', () => {
    expect(routingErrorMessage(new ApiError(409, 'CONFLICT', 'conflict'))).toContain('al mismo tiempo')
    expect(routingErrorMessage(new ApiError(503, 'UNAVAILABLE', 'down'))).toBe('El servicio de rutas aún no está disponible.')
    expect(routingErrorMessage(new ApiError(404, 'NOT_FOUND', 'x'), 'add')).toContain('ya no tiene pedidos')
    const rejected = (message: string) => routingErrorMessage(new ApiError(422, 'FAILED_PRECONDITION', message), 'add')
    expect(rejected('route is at its maximum capacity')).toContain('llena')
    expect(rejected('route has no open stops left')).toContain('terminó')
    expect(rejected('order belongs to another zone than the route')).toContain('otra zona')
    expect(rejected('order does not exist or is not pending')).toContain('ya no está pendiente')
    expect(rejected('something new')).toContain('No se pudo agregar')
  })

  it('en modo demo agregar un pedido responde sin llamar al servidor', async () => {
    vi.stubEnv('VITE_MOCK_ROUTING', 'true')
    try {
      expect(await addOrderToRoute('r-1', 'o-1')).toEqual({ routeId: 'r-1', stop: { orderId: 'o-1', address: 'Pedido o-1', sequence: 99 } })
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
