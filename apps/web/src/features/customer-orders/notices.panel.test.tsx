import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { customerUser, mockApi, renderApp } from '@/test/utils'
import { resetDemoOrders } from './demo'

const surchargeNotice = { id: 'n-1', orderId: 'o-1', kind: 'SURCHARGE_APPLIED', detail: 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z', createdAt: '2026-10-01T09:00:00Z', read: false }
const blockedNotice = { id: 'n-2', orderId: '', kind: 'ACCOUNT_BLOCKED_BY_BALANCE', detail: '', createdAt: '2026-10-16T09:00:00Z', read: false }

function serve(notifications: unknown[]) {
  return mockApi((url) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
    if (url.endsWith('/api/v1/orders/mine')) return { status: 200, body: { orders: [] } }
    if (url.endsWith('/api/v1/notifications/mine')) return { status: 200, body: { notifications } }
    return { status: 200, body: { status: 'ready' } }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
  resetDemoOrders()
})

describe('Mis Pedidos: avisos del recargo y del bloqueo', () => {
  it('muestra el aviso del recargo con motivo, monto y fecha límite', async () => {
    serve([surchargeNotice])
    renderApp('/mis-pedidos')

    const panel = await screen.findByRole('region', { name: 'Avisos de tus pedidos' })
    expect(within(panel).getByText('Se aplicó un recargo a tu cuenta')).toBeInTheDocument()
    expect(within(panel).getByText('Rechazaste el pedido en la entrega: $3.00. Pagar antes del 15/10/2026.')).toBeInTheDocument()
  })

  it('muestra el aviso de bloqueo, que no pertenece a ningún pedido', async () => {
    serve([blockedNotice])
    renderApp('/mis-pedidos')

    const panel = await screen.findByRole('region', { name: 'Avisos de tus pedidos' })
    expect(within(panel).getByText('Tu cuenta quedó bloqueada por saldo pendiente')).toBeInTheDocument()
    expect(within(panel).getByText('Paga tu saldo para volver a crear y cancelar pedidos.')).toBeInTheDocument()
  })

  it('muestra los dos juntos y los de revisión de siempre', async () => {
    const review = { id: 'n-3', orderId: 'o-9', kind: 'ORDER_CONFIRMED', detail: 'Cliente verificado', createdAt: '2026-10-02T09:00:00Z', read: true }
    serve([blockedNotice, surchargeNotice, review])
    renderApp('/mis-pedidos')

    const panel = await screen.findByRole('region', { name: 'Avisos de tus pedidos' })
    expect(within(panel).getAllByRole('listitem')).toHaveLength(3)
    expect(within(panel).getByText('Confirmamos tu pedido')).toBeInTheDocument()
  })

  // Antes de este cambio un tipo desconocido rompia el parseo y el panel completo desaparecia.
  it('un tipo que la app no conoce no debe llevarse los avisos que sí conoce', async () => {
    serve([surchargeNotice, { ...surchargeNotice, id: 'n-9', kind: 'TIPO_FUTURO' }])
    renderApp('/mis-pedidos')

    const panel = await screen.findByRole('region', { name: 'Avisos de tus pedidos' })
    expect(within(panel).getAllByRole('listitem')).toHaveLength(1)
    expect(within(panel).getByText('Se aplicó un recargo a tu cuenta')).toBeInTheDocument()
  })
})
