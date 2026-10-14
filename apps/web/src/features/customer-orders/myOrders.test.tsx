import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { apiError, customerUser, mockApi, renderApp, sentBody } from '@/test/utils'
import { resetDemoOrders } from './demo'
import type { CustomerOrder } from './types'

// The real map needs a browser. Two buttons emit fixed points: one inside the covered area, one outside.
vi.mock('@/features/geo/LazyMapCanvas', async () => {
  const { createElement } = await import('react')
  return {
    LazyMapCanvas: ({ onMapClick }: { onMapClick: (p: { latitude: number; longitude: number }) => void }) =>
      createElement(
        'div',
        null,
        createElement('button', { type: 'button', onClick: () => { onMapClick({ latitude: -0.2, longitude: -78.5 }) } }, 'Elegir punto en mapa'),
        createElement('button', { type: 'button', onClick: () => { onMapClick({ latitude: 40.4, longitude: -3.7 }) } }, 'Elegir punto fuera de zona'),
      ),
  }
})

const order = (over: Partial<CustomerOrder>): CustomerOrder => ({
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  address: 'Av. Central 123',
  latitude: -0.2,
  longitude: -78.5,
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '12:00',
  status: 'PENDING',
  reviewReasons: [],
  createdAt: '2026-10-10T12:00:00Z',
  ...over,
})

function serve(orders: CustomerOrder[] | { status: number; body: unknown }) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
    if (url.endsWith('/api/v1/orders/mine')) return Array.isArray(orders) ? { status: 200, body: { orders } } : orders
    if (url.endsWith('/cancel') && init.method === 'POST') return { status: 200, body: order({ status: 'CANCELLED' }) }
    return { status: 200, body: { status: 'ready' } }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
  resetDemoOrders()
})
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Mis Pedidos: estados de la página', () => {
  it('muestra la carga y luego el pedido en curso', async () => {
    serve([order({ status: 'IN_TRANSIT' })])
    renderApp('/mis-pedidos')
    expect(await screen.findByText('Cargando tus pedidos…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Pedido en Curso/ })).toBeInTheDocument()
    expect(screen.getByText('1 pedido en camino')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Progreso del pedido' })).toHaveAttribute('aria-valuetext', 'En camino')
    expect(screen.queryByText('DEMO · datos simulados')).not.toBeInTheDocument()
  })

  it('muestra un estado vacío', async () => {
    serve([])
    renderApp('/mis-pedidos')
    expect(await screen.findByText('Aún no tienes pedidos')).toBeInTheDocument()
  })

  it.each([404, 503])('muestra "servicio no disponible" ante un %i, sin datos inventados', async (status) => {
    serve(apiError(status, 'NOT_FOUND'))
    renderApp('/mis-pedidos')
    expect(await screen.findByText('El servicio de pedidos aún no está disponible')).toBeInTheDocument()
    expect(screen.queryByText('Historial de Pedidos')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hacer nuevo pedido' })).toBeDisabled()
  })

  it('muestra un error genérico con reintento ante un 500', async () => {
    serve(apiError(500, 'INTERNAL'))
    renderApp('/mis-pedidos')
    expect(await screen.findByText('No pudimos cargar tus pedidos.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('muestra la etiqueta DEMO con el adaptador simulado y sin llamar a la red', async () => {
    vi.stubEnv('VITE_MOCK_CUSTOMER_ORDERS', 'true')
    const fetchMock = serve([])
    renderApp('/mis-pedidos')
    expect(await screen.findByText('DEMO · datos simulados')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Pedido en Curso/ })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([u]) => u.endsWith('/orders/mine'))).toBe(false)
  })
})

describe('Mis Pedidos: pedido en curso', () => {
  it('ofrece cancelar en ROUTE_ASSIGNED con confirmación', async () => {
    const fetchMock = serve([order({ status: 'ROUTE_ASSIGNED' })])
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('¿Cancelar el pedido #AAAAAAAA?')
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar pedido' }))

    await vi.waitFor(() => { expect(screen.queryByRole('dialog')).not.toBeInTheDocument() })
    expect(fetchMock.mock.calls.some(([u, i]) => u.endsWith('/orders/aaaaaaaa-0000-4000-8000-000000000001/cancel') && i?.method === 'POST')).toBe(true)
  })

  it('ofrece cancelar en PENDING', async () => {
    serve([order({ status: 'PENDING' })])
    renderApp('/mis-pedidos')
    expect(await screen.findByRole('button', { name: 'Cancelar pedido' })).toBeInTheDocument()
  })

  it.each(['IN_TRANSIT', 'PICKED_UP', 'DELIVERED'] as const)('no ofrece cancelar en %s', async (status) => {
    serve([order({ status })])
    renderApp('/mis-pedidos')
    await screen.findByRole('heading', { name: /Pedido|Detalle/ })
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })

  it('en revisión muestra un aviso informativo y no un error', async () => {
    serve([order({ status: 'PENDING_REVIEW', reviewReasons: ['ZONE_NOT_COVERED'] })])
    renderApp('/mis-pedidos')
    expect(await screen.findByText('Tu pedido está en revisión por un operador.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })
})

describe('Mis Pedidos: historial', () => {
  const list = [
    order({ id: 'aaaaaaaa-0000-4000-8000-000000000001', status: 'IN_TRANSIT', address: 'Av. Central 123' }),
    order({ id: 'bbbbbbbb-0000-4000-8000-000000000002', status: 'DELIVERED', address: 'Calle Norte 45', deliveryDate: '2026-01-02' }),
    order({ id: 'cccccccc-0000-4000-8000-000000000003', status: 'CANCELLED', address: 'Pasaje Sur 9', deliveryDate: '2026-01-01' }),
  ]

  it('lista los demás pedidos y filtra por búsqueda y estado', async () => {
    serve(list)
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    const section = (await screen.findByRole('heading', { name: 'Historial de Pedidos' })).closest('section')
    if (section === null) throw new Error('history section missing')
    const h = within(section)
    const search = h.getByLabelText('Buscar por dirección o código')

    expect(h.getByText('Calle Norte 45')).toBeInTheDocument()
    expect(h.getByText('Pasaje Sur 9')).toBeInTheDocument()
    expect(h.queryByText('Av. Central 123')).not.toBeInTheDocument()

    await user.type(search, 'norte')
    expect(h.queryByText('Pasaje Sur 9')).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, '#CCCCCCCC')
    expect(h.getByText('Pasaje Sur 9')).toBeInTheDocument()
    expect(h.queryByText('Calle Norte 45')).not.toBeInTheDocument()

    await user.clear(search)
    await user.selectOptions(h.getByLabelText('Filtrar por estado'), 'DELIVERED')
    expect(h.getByText('Calle Norte 45')).toBeInTheDocument()
    expect(h.queryByText('Pasaje Sur 9')).not.toBeInTheDocument()
  })

  it('"Ver detalle" muestra ese pedido en la tarjeta principal', async () => {
    serve(list)
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Ver detalle del pedido #BBBBBBBB' }))
    expect(screen.getByRole('heading', { name: /Detalle del pedido/ })).toHaveTextContent('#BBBBBBBB')
  })
})

describe('Mis Pedidos: crear pedido', () => {
  async function openForm() {
    vi.stubEnv('VITE_MOCK_CUSTOMER_ORDERS', 'true')
    serve([])
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Hacer nuevo pedido' }))
    return { user, dialog: screen.getByRole('dialog') }
  }

  async function fillForm(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, point: string) {
    await user.click(within(dialog).getByRole('button', { name: point }))
    await user.clear(within(dialog).getByLabelText(/Dirección de entrega/))
    await user.type(within(dialog).getByLabelText(/Dirección de entrega/), 'Av. Nueva 500')
    fireEvent.change(within(dialog).getByLabelText(/Fecha de entrega/), { target: { value: '2099-06-01' } })
    await user.click(within(dialog).getByRole('radio', { name: '12–15' }))
    await user.click(within(dialog).getByRole('button', { name: 'Crear pedido' }))
  }

  it('valida los campos obligatorios y la fecha pasada', async () => {
    const { user, dialog } = await openForm()
    await user.click(within(dialog).getByRole('button', { name: 'Crear pedido' }))
    expect(within(dialog).getByText('Elige la fecha de entrega.')).toBeInTheDocument()
    expect(within(dialog).getByText('Elige una ventana de entrega.')).toBeInTheDocument()
    expect(within(dialog).getByText(/Escribe la dirección completa/)).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText(/Fecha de entrega/), { target: { value: '2000-01-01' } })
    await user.click(within(dialog).getByRole('button', { name: 'Crear pedido' }))
    expect(within(dialog).getByText('La fecha de entrega no puede ser anterior a hoy.')).toBeInTheDocument()
  })

  it('crea el pedido, cierra el diálogo y lo muestra en la lista', async () => {
    const { user, dialog } = await openForm()
    await fillForm(user, dialog, 'Elegir punto en mapa')

    await vi.waitFor(() => { expect(screen.queryByRole('dialog')).not.toBeInTheDocument() })
    expect(await screen.findByText(/Pedido creado/)).toBeInTheDocument()
    expect(screen.getByText('Av. Nueva 500')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Pedido en Curso/ })).toBeInTheDocument()
  })

  it('informa (sin error) cuando el pedido queda en revisión por estar fuera de zona', async () => {
    const { user, dialog } = await openForm()
    await fillForm(user, dialog, 'Elegir punto fuera de zona')

    expect(await screen.findByText(/quedó en revisión/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Tu pedido está en revisión por un operador.')).toBeInTheDocument()
  })

  it('no envía las notas al servicio real', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
      if (url.endsWith('/orders/mine')) return { status: 200, body: { orders: [] } }
      if (url.endsWith('/api/v1/orders') && init.method === 'POST') return { status: 201, body: order({ status: 'PENDING' }) }
      return { status: 200, body: {} }
    })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Hacer nuevo pedido' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Notas/), 'Tocar el timbre')
    await fillForm(user, dialog, 'Elegir punto en mapa')

    await vi.waitFor(() => { expect(fetchMock.mock.calls.some(([u, i]) => u.endsWith('/api/v1/orders') && i?.method === 'POST')).toBe(true) })
    const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith('/api/v1/orders') && i?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({
      address: 'Av. Nueva 500',
      latitude: -0.2,
      longitude: -78.5,
      deliveryDate: '2099-06-01',
      windowStart: '12:00',
      windowEnd: '15:00',
    })
  })
})
