import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { apiError, customerUser, mockApi, renderApp } from '@/test/utils'
import { resetDemoOrders } from './demo'
import type { CustomerOrder } from './types'

// El mapa necesita un navegador; el diálogo de nuevo pedido tiene su propia suite. Aquí solo se observan sus callbacks.
vi.mock('@/features/geo/LazyMapCanvas', () => ({ LazyMapCanvas: () => null }))
vi.mock('./NewOrderDialog', () => ({
  NewOrderDialog: ({ onClose, onCreated }: { onClose: () => void; onCreated: (order: { id: string; status: string }) => void }) => (
    <div role="dialog" aria-label="Nuevo pedido de prueba">
      <button type="button" onClick={onClose}>Cerrar nuevo pedido</button>
      <button type="button" onClick={() => { onCreated({ id: 'ord-777', status: 'PENDING' }) }}>Confirmar nuevo pedido</button>
    </div>
  ),
}))

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
  queuePosition: 0,
  ...over,
})

const surcharge = {
  kind: 'SURCHARGE',
  id: 's-1',
  orderId: 'o-1',
  reason: 'CLIENT_REFUSED',
  amount: '3.00',
  startedAt: '2026-10-01T08:00:00Z',
  dueAt: '2026-10-15T08:00:00Z',
  disputableUntil: '2099-01-01T00:00:00Z',
}
const owing = (over: Record<string, unknown> = {}) => ({
  pendingSurcharge: '3.00',
  accountStatus: 'ACTIVO',
  blocked: false,
  simulated: true,
  lines: [surcharge],
  ...over,
})

type Reply = { status: number; body: unknown }

function serve(opts: { orders: Reply; cancel?: Reply; balance?: Reply; pay?: Reply }) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
    if (url.endsWith('/api/v1/notifications/mine')) return { status: 200, body: { notifications: [] } }
    if (url.endsWith('/api/v1/products')) return { status: 200, body: { products: [] } }
    if (url.endsWith('/api/v1/orders/mine')) return opts.orders
    if (url.endsWith('/cancel') && init.method === 'POST') return opts.cancel ?? { status: 200, body: order({ status: 'CANCELLED' }) }
    if (url.endsWith('/customers/me/balance/payment') && init.method === 'POST') {
      return opts.pay ?? { status: 200, body: { status: 'SIMULATED_APPROVED', simulated: true, amount: '3.00', reference: 'SIM-1', unblocked: true, createdAt: '2026-10-29T09:00:00Z' } }
    }
    if (url.endsWith('/customers/me/balance')) return opts.balance ?? { status: 200, body: { pendingSurcharge: '0.00', accountStatus: 'ACTIVO', blocked: false, simulated: true, lines: [] } }
    return { status: 200, body: { status: 'ready' } }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
  resetDemoOrders()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Mis Pedidos: acciones sin pedido en curso', () => {
  it('desde el estado vacío se puede crear un pedido; cerrar el diálogo no muestra aviso y confirmar sí', async () => {
    serve({ orders: { status: 200, body: { orders: [] } } })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Realiza un nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: 'Cerrar nuevo pedido' }))
    expect(screen.queryByRole('dialog', { name: 'Nuevo pedido de prueba' })).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Hacer nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar nuevo pedido' }))

    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent('Pedido creado. Te mostramos su estado a continuación.')
    await user.click(within(notice).getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('el enlace Historial de pedidos lleva a la sección del historial', async () => {
    serve({ orders: { status: 200, body: { orders: [] } } })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')

    await user.click(await screen.findByRole('button', { name: 'Historial de pedidos' }))

    expect(scroll).toHaveBeenCalled()
    scroll.mockRestore()
  })

  it('si los pedidos no cargan, Reintentar vuelve a pedirlos', async () => {
    let calls = 0
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
      if (url.endsWith('/api/v1/notifications/mine')) return { status: 200, body: { notifications: [] } }
      if (url.endsWith('/api/v1/products')) return { status: 200, body: { products: [] } }
      if (url.endsWith('/api/v1/orders/mine')) {
        calls += 1
        return calls === 1 ? apiError(500, 'INTERNAL') : { status: 200, body: { orders: [] } }
      }
      return { status: 200, body: {} }
    })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Aún no tienes pedidos')).toBeInTheDocument()
  })
})

describe('Mis Pedidos: favoritos', () => {
  it('Pedir de nuevo abre el diálogo de nuevo pedido', async () => {
    serve({ orders: { status: 200, body: { orders: [] } } })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    const [favorite] = await screen.findAllByRole('button', { name: /Pedir de nuevo/ })
    await user.click(favorite as HTMLElement)

    expect(screen.getByRole('dialog', { name: 'Nuevo pedido de prueba' })).toBeInTheDocument()
  })
})

describe('Mis Pedidos: cancelación con errores del servidor', () => {
  async function openCancel(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    return screen.getByRole('dialog')
  }

  it('un 409 explica que el estado del pedido ya cambió', async () => {
    serve({ orders: { status: 200, body: { orders: [order({ status: 'ROUTE_ASSIGNED' })] } }, cancel: apiError(409, 'CONFLICT') })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    const dialog = await openCancel(user)

    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar pedido' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Este pedido ya no se puede cancelar porque su estado cambió.')
  })

  it('cualquier otro error pide reintentar, y Volver cierra sin cancelar', async () => {
    serve({ orders: { status: 200, body: { orders: [order({ status: 'ROUTE_ASSIGNED' })] } }, cancel: apiError(500, 'INTERNAL') })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    const dialog = await openCancel(user)

    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar pedido' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('No pudimos cancelar el pedido. Inténtalo de nuevo.')

    await user.click(within(dialog).getByRole('button', { name: 'Volver' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Mis Pedidos: tarjeta del pedido en curso', () => {
  it('con el pedido aceptado muestra un PIN de 4 dígitos que se puede copiar y el texto se restablece', async () => {
    serve({ orders: { status: 200, body: { orders: [order({ id: 'pedido-xyz', status: 'ROUTE_ASSIGNED' })] } } })
    renderApp('/mis-pedidos')
    // userEvent.setup() instala su propio portapapeles: se espía después de crearlo.
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    const pin = (await screen.findByText(/^\d \d \d \d$/)).textContent
    expect(pin).toMatch(/^\d \d \d \d$/)
    await user.click(screen.getByRole('button', { name: 'Copiar código' }))

    expect(writeText).toHaveBeenCalledWith(pin.replace(/\s/g, ''))
    expect(screen.getByRole('button', { name: '¡Copiado!' })).toBeInTheDocument()
    await waitFor(() => { expect(screen.getByRole('button', { name: 'Copiar código' })).toBeInTheDocument() }, { timeout: 3000 })
  })
})

describe('Mis Pedidos: saldo pendiente', () => {
  it('tras pagar, el aviso de pago se puede cerrar', async () => {
    serve({
      orders: { status: 200, body: { orders: [] } },
      balance: { status: 200, body: owing() },
    })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Pagar saldo/ }))
    const notice = await screen.findByRole('status')
    await user.click(within(notice).getByRole('button', { name: 'Cerrar aviso de pago' }))

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('una línea disputable se puede abrir y cerrar sin enviar la disputa', async () => {
    serve({ orders: { status: 200, body: { orders: [] } }, balance: { status: 200, body: owing() } })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()
    const card = await screen.findByRole('region', { name: 'Tu saldo' })
    const line = within(card).getByText('Rechazaste el pedido en la entrega').closest('li') as HTMLElement

    await user.click(within(line).getByRole('button', { name: 'Disputar' }))
    expect(within(line).getByLabelText('Motivo de la disputa')).toBeInTheDocument()
    await user.click(within(line).getByRole('button', { name: 'Cancelar' }))

    expect(within(line).queryByLabelText('Motivo de la disputa')).toBeNull()
    expect(within(line).getByRole('button', { name: 'Disputar' })).toBeInTheDocument()
  })
})
