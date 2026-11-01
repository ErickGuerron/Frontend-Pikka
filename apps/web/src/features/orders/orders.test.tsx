import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp, sentBody } from '@/test/utils'
import type { Order } from './types'

const operatorUser = { ...adminUser, id: '44444444-4444-4444-4444-444444444444', fullName: 'Olga Operadora', role: 'OPERATOR' }

const pendingOrder: Order = {
  id: 'o-1',
  address: 'Av. Central 123, Col. Centro',
  latitude: -0.2,
  longitude: -78.5,
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '11:00',
  status: 'PENDING',
  reviewReasons: [],
  createdAt: '2026-10-10T12:00:00Z',
}

const deliveredOrder: Order = { ...pendingOrder, id: 'o-2', address: 'Calle Norte 45', status: 'DELIVERED' }

const inReviewOrder: Order = {
  ...pendingOrder,
  id: 'o-7',
  address: 'Plaza Foch, Quito',
  status: 'PENDING_REVIEW',
  reviewReasons: ['CUSTOMER_BLOCKED'],
  addressReference: 'Edificio azul, piso 3',
  contactPhone: '0991112233',
}

const outOfZoneOrder: Order = { ...inReviewOrder, id: 'o-8', address: 'Fuera de zona 9', reviewReasons: ['ZONE_NOT_COVERED'] }

/** Responde al perfil autenticado y a /ready; el resto lo decide cada prueba. */
function baseHandler(url: string, me: unknown = adminUser) {
  if (url.endsWith('/auth/me')) return { status: 200, body: me }
  return { status: 200, body: { status: 'ready' } }
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('listado de pedidos', () => {
  it('muestra los pedidos con su estado en texto', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/api/v1/orders') && (init.method ?? 'GET') === 'GET') return { status: 200, body: [pendingOrder, deliveredOrder] }
      return baseHandler(url)
    })
    renderApp('/orders')

    expect(await screen.findByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
    expect(screen.getByText('Calle Norte 45')).toBeInTheDocument()
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
    expect(screen.getByText('Entregado', { selector: 'span' })).toBeInTheDocument()
  })

  it('con el listado vacío no ofrece registrar pedidos: los crea el cliente', async () => {
    mockApi((url) => (url.endsWith('/api/v1/orders') ? { status: 200, body: [] } : baseHandler(url)))
    renderApp('/orders')

    expect(await screen.findByText('Aún no hay pedidos registrados')).toBeInTheDocument()
    expect(screen.getByText(/Los registran los clientes/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pedido/i })).not.toBeInTheDocument()
  })

  it('muestra el error con reintento y recupera los datos al reintentar', async () => {
    let attempts = 0
    mockApi((url) => {
      if (url.endsWith('/api/v1/orders')) {
        attempts += 1
        return attempts === 1 ? apiError(503, 'UPSTREAM_UNAVAILABLE') : { status: 200, body: [pendingOrder] }
      }
      return baseHandler(url)
    })
    renderApp('/orders')
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los pedidos.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
  })

  it('filtra por estado y permite limpiar el filtro', async () => {
    mockApi((url) => (url.endsWith('/api/v1/orders') ? { status: 200, body: [pendingOrder, deliveredOrder] } : baseHandler(url)))
    renderApp('/orders')
    const user = userEvent.setup()

    await screen.findByText('Av. Central 123, Col. Centro')
    await user.selectOptions(screen.getByLabelText('Estado'), 'DELIVERED')
    expect(screen.queryByText('Av. Central 123, Col. Centro')).not.toBeInTheDocument()
    expect(screen.getByText('Calle Norte 45')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar filtro' }))
    expect(screen.getByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
  })
})

describe('el personal no registra pedidos', () => {
  it.each([
    ['ADMIN', adminUser],
    ['OPERATOR', operatorUser],
  ])('%s no ve el botón para crear un pedido', async (_role, me) => {
    mockApi((url) => (url.endsWith('/api/v1/orders') ? { status: 200, body: [pendingOrder] } : baseHandler(url, me)))
    renderApp('/orders')

    expect(await screen.findByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nuevo pedido' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar primer pedido' })).not.toBeInTheDocument()
  })
})

describe('revisión de pedidos desde el listado', () => {
  /** El listado devuelve `orders`; una decisión saca el pedido de revisión. Registra las peticiones. */
  function mockOrders(fixtures: Order[], me: unknown = adminUser, reviewResponse: { status: number; body: unknown } | null = null) {
    // Copias: la decisión cambia el estado del pedido y no debe filtrarse a otras pruebas.
    const orders = fixtures.map((order) => ({ ...order }))
    return mockApi((url, init) => {
      if (url.endsWith('/review') && init.method === 'POST') {
        if (reviewResponse) return reviewResponse
        const id = /orders\/([^/]+)\/review/.exec(url)?.[1]
        const target = orders.find((o) => o.id === id)
        if (target) target.status = 'PENDING'
        return { status: 200, body: { ...inReviewOrder, status: 'PENDING', reviewReasons: [] } }
      }
      if (url.endsWith('/api/v1/orders') && (init.method ?? 'GET') === 'GET') return { status: 200, body: orders }
      return baseHandler(url, me)
    })
  }

  const reviewCall = (fetchMock: ReturnType<typeof mockOrders>) =>
    fetchMock.mock.calls.find(([url, init]) => url.endsWith('/review') && init?.method === 'POST')

  it('solo los pedidos en revisión tienen el botón Revisar', async () => {
    mockOrders([pendingOrder, deliveredOrder, inReviewOrder])
    renderApp('/orders')

    await screen.findByText('Plaza Foch, Quito')
    expect(screen.getAllByRole('button', { name: 'Revisar' })).toHaveLength(1)
    const row = screen.getByText('Plaza Foch, Quito').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByRole('button', { name: 'Revisar' })).toBeInTheDocument()
  })

  it('abre un modal con la dirección, los motivos y los datos de contacto', async () => {
    mockOrders([inReviewOrder])
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))

    const dialog = await screen.findByRole('dialog', { name: 'Revisar pedido' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText(/Plaza Foch, Quito/)).toBeInTheDocument()
    expect(within(dialog).getByText('Cliente bloqueado')).toBeInTheDocument()
    expect(within(dialog).getByText(/Edificio azul, piso 3/)).toBeInTheDocument()
    expect(within(dialog).getByText(/0991112233/)).toBeInTheDocument()
  })

  it('se cierra con Cancelar y con Escape sin enviar nada', async () => {
    const fetchMock = mockOrders([inReviewOrder])
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revisar' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(reviewCall(fetchMock)).toBeUndefined()
  })

  it('aprueba el pedido: envía CONFIRM con el motivo, cierra el modal y actualiza el listado', async () => {
    const fetchMock = mockOrders([inReviewOrder])
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.type(await screen.findByLabelText('Motivo *'), '  Cliente conocido, se acepta  ')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido confirmado.')
    expect(sentBody(reviewCall(fetchMock)?.[1])).toEqual({ action: 'CONFIRM', reason: 'Cliente conocido, se acepta' })
    expect(reviewCall(fetchMock)?.[0]).toMatch(/\/api\/v1\/orders\/o-7\/review$/)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => { expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument() })
  })

  it('rechaza el pedido con motivo', async () => {
    const fetchMock = mockOrders([inReviewOrder])
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.click(await screen.findByLabelText(/^Rechazar/))
    await user.type(screen.getByLabelText('Motivo *'), 'Dirección inexistente')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido rechazado.')
    expect(sentBody(reviewCall(fetchMock)?.[1])).toEqual({ action: 'REJECT', reason: 'Dirección inexistente' })
  })

  it('corrige la ventana y envía la corrección', async () => {
    const fetchMock = mockOrders([inReviewOrder])
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.click(await screen.findByLabelText(/^Corregir/))
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '12:00' } })
    await user.type(screen.getByLabelText('Motivo *'), 'Se ajusta la ventana')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido corregido y guardado.')
    expect(sentBody(reviewCall(fetchMock)?.[1])).toEqual({
      action: 'CORRECT',
      reason: 'Se ajusta la ventana',
      correction: { address: 'Plaza Foch, Quito', deliveryDate: '2099-12-31', windowStart: '09:00', windowEnd: '12:00' },
    })
  })

  it('exige el motivo y no envía la decisión sin él', async () => {
    const fetchMock = mockOrders([inReviewOrder])
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.click(await screen.findByRole('button', { name: 'Guardar decisión' }))

    expect(screen.getByText('Escribe el motivo de la decisión (mínimo 5 caracteres).')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo *')).toHaveAttribute('aria-invalid', 'true')
    expect(reviewCall(fetchMock)).toBeUndefined()
  })

  it('un pedido fuera de zona no se puede confirmar: queda seleccionada la corrección', async () => {
    mockOrders([outOfZoneOrder])
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))

    expect(await screen.findByLabelText(/^Confirmar/)).toBeDisabled()
    expect(screen.getByLabelText(/^Corregir/)).toBeChecked()
  })

  it('si el servidor rechaza la decisión muestra el error dentro del modal y lo conserva abierto', async () => {
    mockOrders([inReviewOrder], adminUser, apiError(409, 'CONFLICT', 'order is not in review'))
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.type(await screen.findByLabelText('Motivo *'), 'Cliente conocido, se acepta')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('No se pudo registrar la decisión.')
    expect(screen.getByLabelText('Motivo *')).toHaveValue('Cliente conocido, se acepta')
  })

  it('el operador también revisa pedidos', async () => {
    mockOrders([inReviewOrder], operatorUser)
    renderApp('/orders')

    expect(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 })).toBeInTheDocument()
  })
})
