import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { customerUser, mockApi, renderApp } from '@/test/utils'
import { resetDemoOrders } from './demo'
import { canCancel, type CustomerOrder, type OrderStatus } from './types'

// The real map needs a browser; the order list does not use it.
vi.mock('@/features/geo/LazyMapCanvas', () => ({ LazyMapCanvas: () => null }))

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

function serve(orders: CustomerOrder[]) {
  return mockApi((url) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
    if (url.includes('/api/v1/products')) return { status: 200, body: { products: [] } }
    if (url.endsWith('/api/v1/coverage/zones')) return { status: 200, body: { zones: [] } }
    if (url.endsWith('/api/v1/orders/mine')) return { status: 200, body: { orders } }
    return { status: 200, body: { status: 'ready' } }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
  resetDemoOrders()
})

describe('PLAN: my orders search with zero matches', () => {
  const list = [
    order({ id: 'aaaaaaaa-0000-4000-8000-000000000001', status: 'IN_TRANSIT', address: 'Av. Central 123' }),
    order({ id: 'bbbbbbbb-0000-4000-8000-000000000002', status: 'DELIVERED', address: 'Calle Norte 45', deliveryDate: '2026-01-02' }),
  ]

  async function openHistory() {
    serve(list)
    renderApp('/mis-pedidos')
    const section = (await screen.findByRole('heading', { name: 'Historial de Pedidos' })).closest('section')
    if (section === null) throw new Error('history section missing')
    return { h: within(section), user: userEvent.setup() }
  }

  it('history_searchWithNoMatch_showsExplicitEmptyResultText', async () => {
    const { h, user } = await openHistory()
    expect(h.getByText('Calle Norte 45')).toBeInTheDocument()

    await user.type(h.getByLabelText('Buscar por dirección o código'), 'zzz-no-existe')

    expect(h.getByRole('status')).toHaveTextContent('Ningún pedido coincide con la búsqueda.')
    expect(h.queryByText('Calle Norte 45')).not.toBeInTheDocument()
    expect(h.queryByRole('table')).not.toBeInTheDocument()
  })

  it('history_statusFilterWithNoMatch_showsExplicitEmptyResultText', async () => {
    const { h, user } = await openHistory()

    await user.selectOptions(h.getByLabelText('Filtrar por estado'), 'CANCELLED')

    expect(h.getByRole('status')).toHaveTextContent('Ningún pedido coincide con la búsqueda.')
    expect(h.queryByText('Calle Norte 45')).not.toBeInTheDocument()
  })
})

describe('PLAN: canCancel truth table (web)', () => {
  // KEEP IDENTICAL to apps/mobile/__tests__/customer-orders.plan.test.ts: web and mobile must agree
  // on which order states a customer may cancel (order-state consistency check).
  const expected: Record<OrderStatus, boolean> = {
    PENDING: true,
    PENDING_REVIEW: false,
    ROUTE_ASSIGNED: true,
    PICKED_UP: false,
    IN_TRANSIT: false,
    DELIVERED: false,
    NOT_DELIVERED: false,
    CANCELLED: false,
  }

  it.each(Object.entries(expected) as [OrderStatus, boolean][])('canCancel_%s_returns_%s', (status, allowed) => {
    expect(canCancel(status)).toBe(allowed)
  })

  it('canCancel_coversEveryStatusExactlyOnce', () => {
    expect(Object.keys(expected)).toHaveLength(8)
  })
})
