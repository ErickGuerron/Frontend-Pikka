import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { apiError, customerUser, mockApi, renderApp } from '@/test/utils'
import { resetDemoOrders } from './demo'

const pendingOrder = {
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
}
const balance = (blocked: boolean) => ({
  pendingSurcharge: blocked ? '3.00' : '0.00',
  accountStatus: blocked ? 'BLOQUEADO_POR_SALDO' : 'ACTIVO',
  blocked,
  simulated: true,
  lines: [],
})
const message = 'Paga tu saldo pendiente para volver a cancelar pedidos.'

function serve(blocked: boolean, cancelReply: { status: number; body: unknown } = { status: 200, body: { ...pendingOrder, status: 'CANCELLED' } }) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
    if (url.endsWith('/api/v1/orders/mine')) return { status: 200, body: { orders: [pendingOrder] } }
    if (url.endsWith('/api/v1/notifications/mine')) return { status: 200, body: { notifications: [] } }
    if (url.endsWith('/customers/me/balance')) return { status: 200, body: balance(blocked) }
    if (url.endsWith('/cancel') && init.method === 'POST') return cancelReply
    return { status: 200, body: { status: 'ready' } }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
  resetDemoOrders()
})

describe('Mis Pedidos: cancelar con la cuenta bloqueada por saldo', () => {
  it('deshabilita «Cancelar pedido» y explica cómo volver a poder cancelar', async () => {
    serve(true)
    renderApp('/mis-pedidos')

    const button = await screen.findByRole('button', { name: 'Cancelar pedido' })
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('con la cuenta activa el botón sigue habilitado y no hay aviso', async () => {
    serve(false)
    renderApp('/mis-pedidos')

    expect(await screen.findByRole('button', { name: 'Cancelar pedido' })).toBeEnabled()
    expect(screen.queryByText(message)).not.toBeInTheDocument()
  })

  it('un 403 al cancelar muestra el mensaje del saldo y no el genérico', async () => {
    serve(false, apiError(403, 'FORBIDDEN'))
    const user = userEvent.setup()
    renderApp('/mis-pedidos')

    await user.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar pedido' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(message)
    expect(dialog).not.toHaveTextContent('No pudimos cancelar el pedido')
  })
})
