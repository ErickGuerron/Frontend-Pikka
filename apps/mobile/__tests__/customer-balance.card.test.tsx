import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native'
import { TextInput } from 'react-native'
import { ApiError } from '../src/api/errors'
import { BalanceCard } from '../src/features/customer-orders/BalanceCard'
import type { BalancePayment, MyBalance } from '../src/features/customer-orders/balance'
import { usePayBalance } from '../src/features/customer-orders/balance-hooks'
import { outcomeOfError, outcomeOfPayment, type Outcome } from '../src/features/customer-orders/payment-outcome'

const owing: MyBalance = {
  pendingSurcharge: '7.50',
  accountStatus: 'BLOQUEADO_POR_SALDO',
  blocked: true,
  simulated: true,
  lines: [
    { kind: 'SURCHARGE', id: 's-1', orderId: 'o-1', reason: 'CLIENT_REFUSED', amount: '3.00', startedAt: '2026-10-01T08:00:00Z', dueAt: '2026-10-15T08:00:00Z' },
    { kind: 'RECIDIVISM', id: 'r-1', orderId: '', reason: 'RECIDIVISM', amount: '4.50', startedAt: '2026-10-03T08:00:00Z', dueAt: '2026-10-17T08:00:00Z' },
  ],
}
const approved: BalancePayment = { status: 'SIMULATED_APPROVED', simulated: true, amount: '7.50', reference: 'SIM-1', unblocked: true, createdAt: '2026-10-29T09:00:00Z' }

/** Every host component type in the rendered tree (a TextInput would appear here). */
function hostTypes(node: unknown): string[] {
  if (node === null || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap((child) => hostTypes(child))
  const { type, children } = node as { type?: string; children?: unknown }
  return [...(typeof type === 'string' ? [type] : []), ...hostTypes(children)]
}

async function renderCard(over: Partial<{ balance: MyBalance | null; paying: boolean; outcome: Outcome | null }> = {}) {
  const onPay = jest.fn()
  const onDismissOutcome = jest.fn()
  const props = { balance: owing, paying: false, outcome: null, onPay, onDismissOutcome, ...over }
  const utils = await render(<BalanceCard {...props} />)
  return { onPay, onDismissOutcome, ...utils }
}

describe('BalanceCard', () => {
  it('shows the total, each line with its reason and due date, and says the payment is simulated', async () => {
    await renderCard()

    expect(screen.getByText('Tu saldo pendiente')).toBeTruthy()
    expect(screen.getAllByText('$7.50').length).toBeGreaterThan(0)
    expect(screen.getByText('Rechazaste el pedido en la entrega')).toBeTruthy()
    expect(screen.getByText('$3.00')).toBeTruthy()
    expect(screen.getByText('Pagar antes del 15/10/2026')).toBeTruthy()
    expect(screen.getByText('Recargo por reincidencia')).toBeTruthy()
    expect(screen.getByText('$4.50')).toBeTruthy()
    expect(screen.getByText(/Pago simulado: no se hará ningún cargo real/)).toBeTruthy()
  })

  it('says a blocked account cannot create or cancel orders', async () => {
    await renderCard()
    expect(screen.getByText(/Tu cuenta está bloqueada por saldo pendiente/)).toBeTruthy()
  })

  it('does not mention a block when the account is not blocked', async () => {
    await renderCard({ balance: { ...owing, blocked: false, accountStatus: 'ACTIVO' } })
    expect(screen.queryByText(/Tu cuenta está bloqueada/)).toBeNull()
  })

  it('pays the whole balance when the button is pressed', async () => {
    const { onPay } = await renderCard()
    await fireEvent.press(screen.getByLabelText('Pagar saldo ($7.50)'))
    expect(onPay).toHaveBeenCalledTimes(1)
  })

  it('cannot be pressed twice while paying', async () => {
    const { onPay } = await renderCard({ paying: true })
    await fireEvent.press(screen.getByLabelText('Pagar saldo ($7.50)'))
    expect(onPay).not.toHaveBeenCalled()
  })

  it('takes up no space with nothing owed and nothing to say', async () => {
    const { toJSON } = await renderCard({ balance: { ...owing, pendingSurcharge: '0.00', blocked: false, accountStatus: 'ACTIVO', lines: [] } })
    expect(toJSON()).toBeNull()
  })

  it('takes up no space while the balance is unknown or unavailable', async () => {
    const { toJSON } = await renderCard({ balance: null })
    expect(toJSON()).toBeNull()
  })

  it('keeps the payment message after the debt is gone, and it can be dismissed', async () => {
    const outcome = outcomeOfPayment(approved)
    const { onDismissOutcome } = await renderCard({ balance: { ...owing, pendingSurcharge: '0.00', blocked: false, accountStatus: 'ACTIVO', lines: [] }, outcome })

    expect(screen.getByText('Pago simulado aprobado. Tu cuenta ya está activa.')).toBeTruthy()
    expect(screen.queryByText('Tu saldo pendiente')).toBeNull()
    await fireEvent.press(screen.getByLabelText('Cerrar aviso de pago'))
    expect(onDismissOutcome).toHaveBeenCalledTimes(1)
  })

  // ADR 0006 sección 3: el sistema no pide ni guarda datos de tarjeta, ni siquiera en simulación.
  it('asks for no card data at all', async () => {
    const { toJSON } = await renderCard()
    expect(hostTypes(toJSON())).not.toContain('TextInput')
    expect(screen.queryByText(/número de tarjeta|vencimiento|cvv|cvc/i)).toBeNull()
  })
})

describe('payment outcomes', () => {
  it('approved and unblocked', () => {
    expect(outcomeOfPayment(approved).text).toBe('Pago simulado aprobado. Tu cuenta ya está activa.')
  })

  it('approved without having been blocked does not claim an unblock', () => {
    const outcome = outcomeOfPayment({ ...approved, unblocked: false })
    expect(outcome.text).toBe('Pago simulado aprobado.')
    expect(outcome.tone).toBe('ok')
  })

  it('declined by the simulated card changes nothing and can be retried', () => {
    const outcome = outcomeOfPayment({ ...approved, status: 'SIMULATED_DECLINED', unblocked: false })
    expect(outcome.text).toBe('La tarjeta simulada rechazó el pago. No se cambió tu saldo; puedes intentarlo de nuevo.')
    expect(outcome.tone).toBe('warn')
  })

  it('maps 422, 409 and anything else to its own message', () => {
    expect(outcomeOfError(new ApiError(422, 'FAILED_PRECONDITION', 'x')).text).toBe('No tienes saldo pendiente por pagar.')
    expect(outcomeOfError(new ApiError(409, 'ABORTED', 'x')).text).toBe(
      'Tu saldo cambió mientras pagabas. El cobro simulado se devolvió; revisa tu saldo e inténtalo de nuevo.',
    )
    expect(outcomeOfError(new ApiError(500, 'INTERNAL', 'x')).text).toBe('No pudimos procesar el pago. Inténtalo de nuevo.')
    expect(outcomeOfError(new Error('network')).text).toBe('No pudimos procesar el pago. Inténtalo de nuevo.')
  })
})

describe('usePayBalance', () => {
  function mockFetch(status: number, body: unknown) {
    const fn = jest.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(body) })
    globalThis.fetch = fn as unknown as typeof fetch
    return fn
  }

  it('posts to the payment endpoint with no body, reloads the balance and reports the outcome', async () => {
    const fetchMock = mockFetch(200, approved)
    const reload = jest.fn()
    const { result } = await renderHook(() => usePayBalance(reload))

    await act(async () => { await result.current.pay() })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url.endsWith('/api/v1/customers/me/balance/payment')).toBe(true)
    expect(init.method).toBe('POST')
    expect(init.body ?? null).toBeNull()
    expect(result.current.outcome?.text).toBe('Pago simulado aprobado. Tu cuenta ya está activa.')
    expect(reload).toHaveBeenCalledTimes(1)
    expect(result.current.paying).toBe(false)
  })

  it.each([
    [409, 'ABORTED', 'Tu saldo cambió mientras pagabas. El cobro simulado se devolvió; revisa tu saldo e inténtalo de nuevo.'],
    [422, 'FAILED_PRECONDITION', 'No tienes saldo pendiente por pagar.'],
    [500, 'INTERNAL', 'No pudimos procesar el pago. Inténtalo de nuevo.'],
  ])('a %i answer is explained and the balance is reloaded anyway', async (status, code, text) => {
    mockFetch(status, { error: { code, message: 'x', requestId: 'r' } })
    const reload = jest.fn()
    const { result } = await renderHook(() => usePayBalance(reload))

    await act(async () => { await result.current.pay() })

    await waitFor(() => { expect(result.current.outcome?.text).toBe(text) })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('a declined simulated card is an answer, not an error', async () => {
    mockFetch(200, { ...approved, status: 'SIMULATED_DECLINED', unblocked: false })
    const { result } = await renderHook(() => usePayBalance(jest.fn()))

    await act(async () => { await result.current.pay() })

    expect(result.current.outcome?.text).toContain('rechazó el pago')
  })

  it('dismissing clears the message', async () => {
    mockFetch(200, approved)
    const { result } = await renderHook(() => usePayBalance(jest.fn()))
    await act(async () => { await result.current.pay() })

    await act(async () => { result.current.dismiss() })

    expect(result.current.outcome).toBeNull()
  })
})

// La guarda de "sin datos de tarjeta" detecta lo que debe: un TextInput en el arbol si existiera.
describe('the card-data guard', () => {
  it('sees a TextInput when there is one', async () => {
    const { toJSON } = await render(<TextInput accessibilityLabel="Número de tarjeta" />)
    expect(hostTypes(toJSON())).toContain('TextInput')
  })
})
