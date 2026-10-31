import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { customerUser, mockApi, renderApp, sentBody } from '@/test/utils'
import { resetDemoOrders } from './demo'

type Reply = { status: number; body: unknown }

const base = { kind: 'SURCHARGE', id: 's-1', orderId: 'o-1', reason: 'CLIENT_REFUSED', amount: '4.20', startedAt: '2026-10-30T12:00:00Z', dueAt: '2026-11-13T12:00:00Z' }
const balanceWith = (line: Record<string, unknown>) => ({
  pendingSurcharge: '4.20',
  accountStatus: 'ACTIVO',
  blocked: false,
  simulated: true,
  lines: [{ ...base, ...line }],
})
const canDispute = balanceWith({ disputableUntil: '2099-01-01T00:00:00Z' })
const dispute = { id: 'd-1', surchargeId: 's-1', customerId: 'c-1', reason: 'Yo estaba en casa y nadie tocó', status: 'OPEN', openedAt: '2026-10-30T12:05:00Z' }

interface State {
  balance: unknown
  open?: Reply
  sent?: { url: string; body: unknown }
}

/** Servidor falso: el saldo y la respuesta de abrir la disputa los fija cada prueba. Guarda el cuerpo que recibió. */
function serve(state: State) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
    if (url.endsWith('/api/v1/orders/mine')) return { status: 200, body: { orders: [] } }
    if (url.endsWith('/api/v1/notifications/mine')) return { status: 200, body: { notifications: [] } }
    if (url.includes('/api/v1/surcharges/') && url.endsWith('/dispute') && init.method === 'POST') {
      state.sent = { url, body: sentBody(init) }
      const reply = state.open ?? { status: 201, body: dispute }
      if (reply.status === 201) state.balance = balanceWith({ disputeStatus: 'OPEN' })
      return reply
    }
    if (url.endsWith('/customers/me/balance')) return { status: 200, body: state.balance }
    return { status: 200, body: { status: 'ready' } }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
  resetDemoOrders()
})
afterEach(() => {
  vi.restoreAllMocks()
})

async function card() {
  return within(await screen.findByRole('region', { name: 'Tu saldo' }))
}

async function openForm(user: ReturnType<typeof userEvent.setup>, reason: string) {
  await user.click((await card()).getByRole('button', { name: 'Disputar' }))
  await user.type(screen.getByRole('textbox', { name: /motivo/i }), reason)
  await user.click(screen.getByRole('button', { name: 'Enviar disputa' }))
}

describe('Mis Pedidos: disputar un recargo', () => {
  it('mientras se puede disputar, ofrece el botón y nada más', async () => {
    serve({ balance: canDispute })
    renderApp('/mis-pedidos')

    expect((await card()).getByRole('button', { name: 'Disputar' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /motivo/i })).not.toBeInTheDocument()
  })

  it('envía solo el motivo al recargo de esa línea y pasa a mostrar «En disputa»', async () => {
    const state: State = { balance: canDispute }
    serve(state)
    renderApp('/mis-pedidos')

    await openForm(userEvent.setup(), 'Yo estaba en casa y nadie tocó')

    await waitFor(() => { expect(state.sent?.url).toMatch(/\/api\/v1\/surcharges\/s-1\/dispute$/) })
    expect(state.sent?.body).toEqual({ reason: 'Yo estaba en casa y nadie tocó' })
    expect(await (await card()).findByText('En disputa')).toBeInTheDocument()
    expect((await card()).queryByRole('button', { name: 'Disputar' })).not.toBeInTheDocument()
  })

  it('un motivo demasiado corto no se envía', async () => {
    const state: State = { balance: canDispute }
    serve(state)
    renderApp('/mis-pedidos')

    await openForm(userEvent.setup(), 'no')

    expect(await screen.findByRole('alert')).toHaveTextContent(/entre 5 y 300/i)
    expect(state.sent).toBeUndefined()
  })

  it.each([
    [422, /plazo/i],
    [409, /ya tiene una disputa/i],
    [500, /no pudimos/i],
  ])('si el servidor responde %i muestra un mensaje claro y deja intentar de nuevo', async (status, message) => {
    serve({ balance: canDispute, open: { status, body: { error: { code: 'X', message: 'x', requestId: 'r' } } } })
    renderApp('/mis-pedidos')

    await openForm(userEvent.setup(), 'Yo estaba en casa y nadie tocó')

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: 'Enviar disputa' })).toBeEnabled()
  })

  it('una disputa abierta se ve como tal y ya no deja disputar', async () => {
    serve({ balance: balanceWith({ disputeStatus: 'OPEN' }) })
    renderApp('/mis-pedidos')

    const c = await card()
    expect(await c.findByText('En disputa')).toBeInTheDocument()
    expect(c.queryByRole('button', { name: 'Disputar' })).not.toBeInTheDocument()
  })

  it('una disputa resuelta en contra lo dice y el recargo sigue en el saldo', async () => {
    serve({ balance: balanceWith({ disputeStatus: 'AGAINST' }) })
    renderApp('/mis-pedidos')

    const c = await card()
    expect(await c.findByText('Disputa rechazada')).toBeInTheDocument()
    expect(c.getAllByText('$4.20').length).toBeGreaterThan(0)
  })

  it('sin plazo (vencido o no disputable) no hay botón ni estado', async () => {
    serve({ balance: balanceWith({}) })
    renderApp('/mis-pedidos')

    const c = await card()
    expect(c.queryByRole('button', { name: 'Disputar' })).not.toBeInTheDocument()
    expect(c.queryByText('En disputa')).not.toBeInTheDocument()
  })
})
