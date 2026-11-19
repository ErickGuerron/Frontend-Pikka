import { act, cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp } from '@/test/utils'
import { listDemoActiveRoutes } from './demo'
import { type TrackedRoute } from './types'

/** Socket falso: el test dispara open, message y close como lo haría el navegador. */
class FakeSocket {
  static instances: FakeSocket[] = []
  onopen: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: unknown) => void) | null = null
  close = vi.fn()
  constructor(public readonly url: string) {
    FakeSocket.instances.push(this)
  }
}

const socketRoutes: TrackedRoute[] = [
  {
    id: 'route-live',
    driverName: 'Socket Driver',
    stops: [{ orderId: 'o-live', address: 'Calle en vivo 1', sequence: 1, status: 'IN_TRANSIT' }],
  },
]

function snapshotApi(restReply: { status: number; body: unknown } = { status: 200, body: [] }) {
  return mockApi((url) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    if (url.endsWith('/api/v1/tracking/routes/active')) return restReply
    return { status: 200, body: [] }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
  FakeSocket.instances = []
  vi.stubGlobal('WebSocket', FakeSocket)
  vi.stubEnv('VITE_TRACKING_LIVE', 'true')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('seguimiento con conexión en vivo', () => {
  it('abre el WebSocket y muestra "En vivo" cuando se conecta', async () => {
    snapshotApi()
    renderApp('/tracking')

    await screen.findByText('No hay rutas en curso.')
    expect(FakeSocket.instances).toHaveLength(1)
    expect(FakeSocket.instances[0]?.url).toMatch(/\/api\/v1\/tracking\/ws$/)

    act(() => { FakeSocket.instances[0]?.onopen?.({}) })

    expect(screen.getByRole('status')).toHaveTextContent('En vivo')
  })

  it('un snapshot por el socket reemplaza la lista de rutas', async () => {
    snapshotApi()
    renderApp('/tracking')
    await screen.findByText('No hay rutas en curso.')

    act(() => { FakeSocket.instances[0]?.onmessage?.({ data: JSON.stringify(socketRoutes) }) })

    expect(await screen.findByRole('heading', { name: 'Socket Driver' })).toBeInTheDocument()
    expect(screen.getByText('Calle en vivo 1')).toBeInTheDocument()
  })

  it('un mensaje mal formado se descarta y la lista anterior se conserva', async () => {
    snapshotApi({ status: 200, body: socketRoutes })
    renderApp('/tracking')
    await screen.findByRole('heading', { name: 'Socket Driver' })

    act(() => { FakeSocket.instances[0]?.onmessage?.({ data: 'no es json' }) })

    expect(screen.getByRole('heading', { name: 'Socket Driver' })).toBeInTheDocument()
  })

  it('si la conexión cae avisa que se reconecta', async () => {
    snapshotApi()
    renderApp('/tracking')
    await screen.findByText('No hay rutas en curso.')
    const socket = FakeSocket.instances[0]
    act(() => { socket?.onopen?.({}) })

    act(() => { socket?.onclose?.({}) })

    expect(screen.getByRole('status')).toHaveTextContent('Reconectando…')
  })

  it('al salir de la página cierra el socket abierto', async () => {
    snapshotApi()
    renderApp('/tracking')
    await screen.findByText('No hay rutas en curso.')
    const socket = FakeSocket.instances[0]

    cleanup()

    expect(socket?.close).toHaveBeenCalledTimes(1)
  })
})

describe('seguimiento: reintento', () => {
  it('el botón Reintentar vuelve a pedir el snapshot tras un error', async () => {
    let calls = 0
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/tracking/routes/active')) {
        calls += 1
        return calls === 1 ? apiError(500, 'INTERNAL') : { status: 200, body: socketRoutes }
      }
      return { status: 200, body: [] }
    })
    renderApp('/tracking')
    const user = userEvent.setup()
    const alert = await screen.findByRole('alert')

    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Socket Driver' })).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})

describe('datos de muestra del seguimiento', () => {
  it('la muestra incluye rutas con paradas en distintos estados', async () => {
    const routes = await listDemoActiveRoutes()

    expect(routes.map((route) => route.id)).toEqual(['route-1', 'route-2'])
    expect(routes[0]?.stops.map((stop) => stop.status)).toEqual(['DELIVERED', 'IN_TRANSIT', 'PENDING'])
  })
})
