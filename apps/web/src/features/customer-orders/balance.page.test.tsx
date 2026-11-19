import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { apiError, customerUser, mockApi, renderApp } from '@/test/utils'
import { resetDemoOrders } from './demo'

type Reply = { status: number; body: unknown }

const surchargeLine = {
  kind: 'SURCHARGE',
  id: 's-1',
  orderId: 'o-1',
  reason: 'CLIENT_REFUSED',
  amount: '3.00',
  startedAt: '2026-10-01T08:00:00Z',
  dueAt: '2026-10-15T08:00:00Z',
}
const extraLine = { kind: 'RECIDIVISM', id: 'r-1', reason: 'RECIDIVISM', amount: '4.50', startedAt: '2026-10-03T08:00:00Z', dueAt: '2026-10-17T08:00:00Z' }

const owing = (over: Record<string, unknown> = {}) => ({
  pendingSurcharge: '7.50',
  accountStatus: 'BLOQUEADO_POR_SALDO',
  blocked: true,
  simulated: true,
  lines: [surchargeLine, extraLine],
  ...over,
})
const clear = { pendingSurcharge: '0.00', accountStatus: 'ACTIVO', blocked: false, simulated: true, lines: [] }

const approved = { status: 'SIMULATED_APPROVED', simulated: true, amount: '7.50', reference: 'SIM-1', unblocked: true, createdAt: '2026-10-29T09:00:00Z' }

/** Servidor falso: el saldo y la respuesta del pago los fija cada prueba; tras un pago aprobado el saldo queda en cero. */
function serve(state: { balance: Reply; payment?: Reply }) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
    if (url.endsWith('/api/v1/orders/mine')) return { status: 200, body: { orders: [] } }
    if (url.endsWith('/api/v1/notifications/mine')) return { status: 200, body: { notifications: [] } }
    if (url.endsWith('/customers/me/balance/payment') && init.method === 'POST') {
      const reply = state.payment ?? { status: 200, body: approved }
      if (reply.status === 200 && (reply.body as { status?: string }).status === 'SIMULATED_APPROVED') state.balance = { status: 200, body: clear }
      return reply
    }
    if (url.endsWith('/customers/me/balance')) return state.balance
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

describe('Mis Pedidos: tarjeta de saldo', () => {
  it('muestra el total, cada línea con su motivo y fecha límite, y avisa que el pago es simulado', async () => {
    serve({ balance: { status: 200, body: owing() } })
    renderApp('/mis-pedidos')

    const card = await screen.findByRole('region', { name: 'Tu saldo' })
    expect(within(card).getByRole('heading', { name: 'Tu saldo pendiente' })).toBeInTheDocument()
    expect(within(card).getByText('$7.50')).toBeInTheDocument()
    expect(within(card).getByText('Rechazaste el pedido en la entrega')).toBeInTheDocument()
    expect(within(card).getByText('$3.00')).toBeInTheDocument()
    expect(within(card).getByText('Pagar antes del 15/10/2026')).toBeInTheDocument()
    expect(within(card).getByText('Recargo por reincidencia')).toBeInTheDocument()
    expect(within(card).getByText('$4.50')).toBeInTheDocument()
    expect(within(card).getByText(/Pago simulado: no se hará ningún cargo real/)).toBeInTheDocument()
  })

  it('una cuenta bloqueada lo dice y no deja crear pedidos', async () => {
    serve({ balance: { status: 200, body: owing() } })
    renderApp('/mis-pedidos')

    expect(await screen.findByText(/Tu cuenta está bloqueada por saldo pendiente/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hacer nuevo pedido' })).toBeDisabled()
  })

  it('con deuda pero sin bloqueo muestra la tarjeta y deja crear pedidos', async () => {
    serve({ balance: { status: 200, body: owing({ blocked: false, accountStatus: 'ACTIVO' }) } })
    renderApp('/mis-pedidos')

    expect(await screen.findByRole('region', { name: 'Tu saldo' })).toBeInTheDocument()
    expect(screen.queryByText(/Tu cuenta está bloqueada/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hacer nuevo pedido' })).toBeEnabled()
  })

  it('sin deuda no ocupa espacio', async () => {
    serve({ balance: { status: 200, body: clear } })
    renderApp('/mis-pedidos')

    expect(await screen.findByText('Aún no tienes pedidos')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tu saldo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hacer nuevo pedido' })).toBeEnabled()
  })

  it.each([404, 503])('con el servicio no disponible (%i) la tarjeta no aparece y la página sigue funcionando', async (status) => {
    serve({ balance: apiError(status, 'NOT_FOUND') })
    renderApp('/mis-pedidos')

    expect(await screen.findByText('Aún no tienes pedidos')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tu saldo' })).not.toBeInTheDocument()
  })

  it('una respuesta que no cumple el contrato no rompe la página', async () => {
    serve({ balance: { status: 200, body: { status: 'ready' } } })
    renderApp('/mis-pedidos')

    expect(await screen.findByText('Aún no tienes pedidos')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tu saldo' })).not.toBeInTheDocument()
  })

  it('en modo demo no llama al servicio de saldo', async () => {
    vi.stubEnv('VITE_MOCK_CUSTOMER_ORDERS', 'true')
    const fetchMock = serve({ balance: { status: 200, body: owing() } })
    renderApp('/mis-pedidos')

    expect(await screen.findByText('DEMO · datos simulados')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([u]) => u.endsWith('/customers/me/balance'))).toBe(false)
    expect(screen.queryByRole('region', { name: 'Tu saldo' })).not.toBeInTheDocument()
  })

  // ADR 0006 sección 3: el sistema no pide ni guarda datos de tarjeta, ni siquiera en simulación.
  it('no pide ningún dato de tarjeta', async () => {
    serve({ balance: { status: 200, body: owing() } })
    renderApp('/mis-pedidos')

    const card = await screen.findByRole('region', { name: 'Tu saldo' })
    expect(within(card).queryAllByRole('textbox')).toHaveLength(0)
    expect(within(card).queryByLabelText(/número|vencimiento|cvv|cvc/i)).not.toBeInTheDocument()
  })
})

describe('Mis Pedidos: pagar el saldo', () => {
  it('paga el saldo completo sin enviar monto y avisa que la cuenta volvió a estar activa', async () => {
    const fetchMock = serve({ balance: { status: 200, body: owing() } })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Pagar saldo/ }))

    expect(await screen.findByText('Pago simulado aprobado. Tu cuenta ya está activa.')).toBeInTheDocument()
    const call = fetchMock.mock.calls.find(([u]) => u.endsWith('/customers/me/balance/payment'))
    expect(call?.[1]?.method).toBe('POST')
    // Sin cuerpo: el monto lo fija el servidor, el cliente no puede elegirlo.
    expect(call?.[1]?.body ?? null).toBeNull()
    // El saldo se refresca: la tarjeta desaparece y el botón de pedidos vuelve a estar disponible.
    await waitFor(() => { expect(screen.queryByRole('region', { name: 'Tu saldo' })).not.toBeInTheDocument() })
    expect(screen.getByText('Pago simulado aprobado. Tu cuenta ya está activa.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hacer nuevo pedido' })).toBeEnabled()
  })

  it('un pago aprobado de una cuenta que no estaba bloqueada no dice que se desbloqueó', async () => {
    serve({
      balance: { status: 200, body: owing({ blocked: false, accountStatus: 'ACTIVO' }) },
      payment: { status: 200, body: { ...approved, unblocked: false } },
    })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Pagar saldo/ }))

    expect(await screen.findByText('Pago simulado aprobado.')).toBeInTheDocument()
    expect(screen.queryByText(/ya está activa/)).not.toBeInTheDocument()
  })

  it('una tarjeta simulada rechazada no cambia nada y deja reintentar', async () => {
    serve({ balance: { status: 200, body: owing() }, payment: { status: 200, body: { ...approved, status: 'SIMULATED_DECLINED', unblocked: false } } })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Pagar saldo/ }))

    expect(await screen.findByText('La tarjeta simulada rechazó el pago. No se cambió tu saldo; puedes intentarlo de nuevo.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tu saldo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pagar saldo/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Hacer nuevo pedido' })).toBeDisabled()
  })

  it('si el saldo cambió mientras pagaba (409) explica que el cobro se devolvió', async () => {
    serve({ balance: { status: 200, body: owing() }, payment: apiError(409, 'ABORTED') })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Pagar saldo/ }))

    expect(await screen.findByText('Tu saldo cambió mientras pagabas. El cobro simulado se devolvió; revisa tu saldo e inténtalo de nuevo.')).toBeInTheDocument()
  })

  it('si ya no debe nada (422) lo dice', async () => {
    serve({ balance: { status: 200, body: owing() }, payment: apiError(422, 'FAILED_PRECONDITION') })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Pagar saldo/ }))

    expect(await screen.findByText('No tienes saldo pendiente por pagar.')).toBeInTheDocument()
  })

  it('ante un error inesperado muestra un mensaje genérico y permite reintentar', async () => {
    serve({ balance: { status: 200, body: owing() }, payment: apiError(500, 'INTERNAL') })
    renderApp('/mis-pedidos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Pagar saldo/ }))

    expect(await screen.findByText('No pudimos procesar el pago. Inténtalo de nuevo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pagar saldo/ })).toBeEnabled()
  })
})
