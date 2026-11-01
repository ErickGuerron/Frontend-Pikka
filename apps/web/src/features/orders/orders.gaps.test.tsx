import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp, sentBody } from '@/test/utils'
import { createOrder } from './api'
import { OrderContactFields } from './OrderContactFields'
import { OrderDetailsFields } from './OrderDetailsFields'
import { OrderItemsPicker } from './OrderItemsPicker'
import type { NewOrder, Order } from './types'

const water = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Agua 1L',
  description: 'Botella',
  unitPrice: '2.50',
  active: true,
  stockQuantity: 10,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

function withQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>
}

describe('listado de pedidos: aviso de la decisión', () => {
  beforeEach(() => {
    useSession.getState().setToken('tok')
  })

  it('tras decidir sobre un pedido en revisión, el aviso se puede cerrar', async () => {
    const inReview: Order = {
      id: 'o-7',
      address: 'Plaza Foch, Quito',
      latitude: -0.2,
      longitude: -78.5,
      deliveryDate: '2099-12-31',
      windowStart: '09:00',
      windowEnd: '11:00',
      status: 'PENDING_REVIEW',
      reviewReasons: ['CUSTOMER_BLOCKED'],
      createdAt: '2026-10-10T12:00:00Z',
    }
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/review') && init.method === 'POST') return { status: 200, body: { ...inReview, status: 'PENDING' } }
      if (url.endsWith('/api/v1/orders') && (init.method ?? 'GET') === 'GET') return { status: 200, body: [inReview] }
      return { status: 200, body: [] }
    })
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.type(screen.getByLabelText('Motivo *'), 'Cliente frecuente, se acepta la ventana')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    const notice = await screen.findByRole('status')
    await user.click(within(notice).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('selector de productos del pedido', () => {
  it('si el catálogo no carga, Reintentar vuelve a pedirlo', async () => {
    let calls = 0
    mockApi((url) => {
      if (url.includes('/api/v1/products')) {
        calls += 1
        return calls === 1 ? apiError(500, 'INTERNAL') : { status: 200, body: { products: [water] } }
      }
      return { status: 200, body: {} }
    })
    render(withQuery(<OrderItemsPicker value={[]} onChange={vi.fn()} />))
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los productos.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('button', { name: 'Agregar una unidad de Agua 1L' })).toBeInTheDocument()
  })

  it('quitar una unidad de un producto con cantidad mayor que cero la reduce en uno', async () => {
    mockApi(() => ({ status: 200, body: { products: [water] } }))
    const onChange = vi.fn()
    render(withQuery(<OrderItemsPicker value={[{ productId: water.id, quantity: 2 }]} onChange={onChange} />))
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Quitar una unidad de Agua 1L' }))

    expect(onChange).toHaveBeenCalledWith([{ productId: water.id, quantity: 1 }])
  })
})

describe('datos de contacto del pedido', () => {
  it('escribir el código postal informa el cambio con su clave', () => {
    const onChange = vi.fn()
    render(
      <OrderContactFields
        idPrefix="new"
        values={{ addressReference: '', postalCode: '', contactPhone: '' }}
        errors={{}}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('170150'), { target: { value: '170150' } })

    expect(onChange).toHaveBeenCalledWith('postalCode', '170150')
  })
})

describe('detalles de entrega del pedido', () => {
  const values = { address: 'Av. Central 123', deliveryDate: '2099-12-31', windowStart: '09:00', windowEnd: '11:00' }

  it('editar la dirección informa el cambio con la clave address', () => {
    const onChange = vi.fn()
    render(<OrderDetailsFields idPrefix="review" values={values} errors={{}} onChange={onChange} />)

    fireEvent.change(screen.getByDisplayValue('Av. Central 123'), { target: { value: 'Av. Amazonas 45' } })

    expect(onChange).toHaveBeenCalledWith('address', 'Av. Amazonas 45')
  })

  it('cambiar la hora de inicio de la ventana informa el cambio con la clave windowStart', () => {
    const onChange = vi.fn()
    render(<OrderDetailsFields idPrefix="review" values={values} errors={{}} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '10:30' } })

    expect(onChange).toHaveBeenCalledWith('windowStart', '10:30')
  })
})

describe('registro de pedidos (API)', () => {
  it('envía el pedido por POST y devuelve el pedido creado', async () => {
    const created: Order = {
      id: 'o-new',
      address: 'Av. Central 123',
      latitude: -0.2,
      longitude: -78.5,
      deliveryDate: '2099-12-31',
      windowStart: '09:00',
      windowEnd: '11:00',
      status: 'PENDING',
      reviewReasons: [],
      createdAt: '2026-10-10T12:00:00Z',
    }
    const fetchMock = mockApi((url, init) => (url.endsWith('/api/v1/orders') && init.method === 'POST'
      ? { status: 201, body: created }
      : { status: 404, body: {} }))
    const input: NewOrder = {
      address: 'Av. Central 123',
      latitude: -0.2,
      longitude: -78.5,
      deliveryDate: '2099-12-31',
      windowStart: '09:00',
      windowEnd: '11:00',
      items: [{ productId: water.id, quantity: 1 }],
      addressReference: 'Casa azul',
      postalCode: '170150',
      contactPhone: '0991112233',
    }

    const order = await createOrder(input)

    expect(order.id).toBe('o-new')
    expect(sentBody(fetchMock.mock.calls[0]?.[1])).toMatchObject({ address: 'Av. Central 123', postalCode: '170150' })
  })
})
