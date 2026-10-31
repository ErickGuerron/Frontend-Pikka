import {
  balanceReasonLabel,
  formatDueDate,
  formatMoney,
  hasDebt,
  parseBalancePayment,
  parseMyBalance,
  type MyBalance,
} from '../src/features/customer-orders/balance'

const line = {
  kind: 'SURCHARGE',
  id: 's-1',
  orderId: 'o-1',
  reason: 'CLIENT_REFUSED',
  amount: '3.00',
  startedAt: '2026-10-01T08:00:00Z',
  dueAt: '2026-10-15T08:00:00Z',
}
const body = { pendingSurcharge: '7.50', accountStatus: 'BLOQUEADO_POR_SALDO', blocked: true, simulated: true, lines: [line] }

describe('parseMyBalance', () => {
  it('accepts the Gateway response', () => {
    const balance = parseMyBalance(body)
    expect(balance.pendingSurcharge).toBe('7.50')
    expect(balance.blocked).toBe(true)
    expect(balance.lines[0]).toMatchObject({ kind: 'SURCHARGE', reason: 'CLIENT_REFUSED', amount: '3.00', orderId: 'o-1' })
  })

  it('a recidivism line has no order: orderId is empty', () => {
    const extra = { kind: 'RECIDIVISM', id: 'r-1', reason: 'RECIDIVISM', amount: '4.50', startedAt: line.startedAt, dueAt: line.dueAt }
    expect(parseMyBalance({ ...body, lines: [extra] }).lines[0]?.orderId).toBe('')
  })

  it('accepts the reassignment fee line, which does carry its order', () => {
    const fee = { kind: 'REASSIGNMENT', id: 'a-1', orderId: 'o-9', reason: 'REASSIGNMENT', amount: '2.50', startedAt: line.startedAt, dueAt: line.dueAt }
    expect(parseMyBalance({ ...body, lines: [fee] }).lines[0]).toMatchObject({ kind: 'REASSIGNMENT', orderId: 'o-9', amount: '2.50' })
  })

  it.each([
    ['an unknown account status', { ...body, accountStatus: 'SUSPENDIDO' }],
    ['an unknown line kind', { ...body, lines: [{ ...line, kind: 'OTRO' }] }],
    ['a blocked flag that is not a boolean', { ...body, blocked: 'si' }],
    ['lines that is not an array', { ...body, lines: {} }],
    ['an amount that is not text (never a float)', { ...body, pendingSurcharge: 7.5 }],
    ['a line without a due date', { ...body, lines: [{ ...line, dueAt: undefined }] }],
  ])('rejects %s', (_name, bad) => {
    expect(() => parseMyBalance(bad)).toThrow()
  })
})

describe('parseBalancePayment', () => {
  const ok = { status: 'SIMULATED_APPROVED', simulated: true, amount: '7.50', reference: 'SIM-1', unblocked: true, createdAt: '2026-10-29T09:00:00Z' }

  it('accepts an approved and a declined payment', () => {
    expect(parseBalancePayment(ok).unblocked).toBe(true)
    expect(parseBalancePayment({ ...ok, status: 'SIMULATED_DECLINED', unblocked: false }).status).toBe('SIMULATED_DECLINED')
  })

  it('rejects a status that is not simulated: a charge is never shown as real', () => {
    expect(() => parseBalancePayment({ ...ok, status: 'APPROVED' })).toThrow()
    expect(() => parseBalancePayment({ ...ok, status: 'PAID' })).toThrow()
  })
})

describe('texts', () => {
  it('translates the known reasons', () => {
    expect(balanceReasonLabel('CLIENT_REFUSED')).toBe('Rechazaste el pedido en la entrega')
    expect(balanceReasonLabel('RECIDIVISM')).toBe('Recargo por reincidencia')
    expect(balanceReasonLabel('REASSIGNMENT')).toBe('Cobro por cambio de entrega')
  })

  it('an unknown reason never shows the raw code', () => {
    const label = balanceReasonLabel('CODIGO_NUEVO')
    expect(label).toBe('Recargo por una entrega no realizada')
    expect(label).not.toContain('CODIGO')
  })

  it('formats money without going through number', () => {
    expect(formatMoney('7.50')).toBe('$7.50')
    expect(formatMoney('1234567890123456.05')).toBe('$1234567890123456.05')
  })

  it('formats the due date in UTC, independent of the device time zone', () => {
    expect(formatDueDate('2026-10-15T08:00:00Z')).toBe('15/10/2026')
    expect(formatDueDate('2026-10-15T23:59:59Z')).toBe('15/10/2026')
  })
})

describe('hasDebt', () => {
  const base: MyBalance = { pendingSurcharge: '0.00', accountStatus: 'ACTIVO', blocked: false, simulated: true, lines: [] }

  it('owes nothing with no lines, no block and a zero balance', () => {
    expect(hasDebt(base)).toBe(false)
  })

  it('owes with lines, with a block or with a balance above zero', () => {
    expect(hasDebt({ ...base, lines: [{ kind: 'SURCHARGE', id: 'a', orderId: '', reason: 'X', amount: '1.00', startedAt: '', dueAt: '' }] })).toBe(true)
    expect(hasDebt({ ...base, blocked: true })).toBe(true)
    expect(hasDebt({ ...base, pendingSurcharge: '0.01' })).toBe(true)
  })
})
