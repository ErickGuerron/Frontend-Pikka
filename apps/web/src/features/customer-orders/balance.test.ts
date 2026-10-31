import { describe, expect, it } from 'vitest'
import {
  balanceReasonLabel,
  formatDueDate,
  formatMoney,
  hasDebt,
  parseBalancePayment,
  parseMyBalance,
  type MyBalance,
} from './balance'

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
  it('acepta la respuesta del Gateway', () => {
    const balance = parseMyBalance(body)
    expect(balance.pendingSurcharge).toBe('7.50')
    expect(balance.blocked).toBe(true)
    expect(balance.lines).toHaveLength(1)
    expect(balance.lines[0]).toMatchObject({ kind: 'SURCHARGE', reason: 'CLIENT_REFUSED', amount: '3.00', orderId: 'o-1' })
  })

  it('el recargo extra no trae pedido: orderId queda vacío', () => {
    const extra = { kind: 'RECIDIVISM', id: 'r-1', reason: 'RECIDIVISM', amount: '4.50', startedAt: line.startedAt, dueAt: line.dueAt }
    expect(parseMyBalance({ ...body, lines: [extra] }).lines[0]?.orderId).toBe('')
  })

  it('acepta la línea del cobro por reasignación, que sí trae pedido', () => {
    const fee = { kind: 'REASSIGNMENT', id: 'a-1', orderId: 'o-9', reason: 'REASSIGNMENT', amount: '2.50', startedAt: line.startedAt, dueAt: line.dueAt }
    expect(parseMyBalance({ ...body, lines: [fee] }).lines[0]).toMatchObject({ kind: 'REASSIGNMENT', orderId: 'o-9', amount: '2.50' })
  })

  it('lee el estado de la disputa y el plazo para disputar; sin ellos quedan vacíos', () => {
    const disputed = { ...line, disputeStatus: 'OPEN' }
    const open = { ...line, disputableUntil: '2026-10-01T10:00:00Z' }
    const parsed = parseMyBalance({ ...body, lines: [line, disputed, open] }).lines
    expect(parsed[0]).toMatchObject({ disputeStatus: '', disputableUntil: '' })
    expect(parsed[1]).toMatchObject({ disputeStatus: 'OPEN', disputableUntil: '' })
    expect(parsed[2]).toMatchObject({ disputeStatus: '', disputableUntil: '2026-10-01T10:00:00Z' })
  })

  it('un estado de disputa que esta versión no conoce no rompe el saldo: se ignora', () => {
    const parsed = parseMyBalance({ ...body, lines: [{ ...line, disputeStatus: 'ESTADO_NUEVO' }] }).lines
    expect(parsed[0]?.disputeStatus).toBe('')
  })

  it('acepta una lista vacía', () => {
    expect(parseMyBalance({ ...body, pendingSurcharge: '0.00', accountStatus: 'ACTIVO', blocked: false, lines: [] }).lines).toEqual([])
  })

  it.each([
    ['un estado de cuenta desconocido', { ...body, accountStatus: 'SUSPENDIDO' }],
    ['un tipo de línea desconocido', { ...body, lines: [{ ...line, kind: 'OTRO' }] }],
    ['blocked que no es booleano', { ...body, blocked: 'si' }],
    ['lines que no es un arreglo', { ...body, lines: {} }],
    ['un monto que no es texto (nunca un float)', { ...body, pendingSurcharge: 7.5 }],
    ['una línea sin fecha límite', { ...body, lines: [{ ...line, dueAt: undefined }] }],
  ])('rechaza %s', (_name, bad) => {
    expect(() => parseMyBalance(bad)).toThrow()
  })
})

describe('parseBalancePayment', () => {
  const ok = { status: 'SIMULATED_APPROVED', simulated: true, amount: '7.50', reference: 'SIM-1', unblocked: true, createdAt: '2026-10-29T09:00:00Z' }

  it('acepta un pago aprobado y uno rechazado', () => {
    expect(parseBalancePayment(ok).unblocked).toBe(true)
    expect(parseBalancePayment({ ...ok, status: 'SIMULATED_DECLINED', unblocked: false }).status).toBe('SIMULATED_DECLINED')
  })

  it('rechaza un estado que no sea simulado: nunca se presenta un cobro como real', () => {
    expect(() => parseBalancePayment({ ...ok, status: 'APPROVED' })).toThrow()
    expect(() => parseBalancePayment({ ...ok, status: 'PAID' })).toThrow()
  })
})

describe('textos', () => {
  it('traduce los motivos conocidos', () => {
    expect(balanceReasonLabel('CLIENT_REFUSED')).toBe('Rechazaste el pedido en la entrega')
    expect(balanceReasonLabel('RECIDIVISM')).toBe('Recargo por reincidencia')
    expect(balanceReasonLabel('REASSIGNMENT')).toBe('Cobro por cambio de entrega')
  })

  it('un motivo desconocido no muestra el código crudo', () => {
    const label = balanceReasonLabel('CODIGO_NUEVO')
    expect(label).toBe('Recargo por una entrega no realizada')
    expect(label).not.toContain('CODIGO')
  })

  it('formatea el dinero sin pasar por number', () => {
    expect(formatMoney('7.50')).toBe('$7.50')
    expect(formatMoney('1234567890123456.05')).toBe('$1234567890123456.05')
  })

  it('formatea la fecha límite en UTC, sin depender de la zona del navegador', () => {
    expect(formatDueDate('2026-10-15T08:00:00Z')).toBe('15/10/2026')
    expect(formatDueDate('2026-10-15T23:59:59Z')).toBe('15/10/2026')
  })
})

describe('hasDebt', () => {
  const base: MyBalance = { pendingSurcharge: '0.00', accountStatus: 'ACTIVO', blocked: false, simulated: true, lines: [] }
  it('no hay deuda sin líneas, sin bloqueo y con saldo cero', () => {
    expect(hasDebt(base)).toBe(false)
  })
  it('hay deuda con líneas, con bloqueo o con saldo mayor que cero', () => {
    expect(hasDebt({ ...base, lines: [{ kind: 'SURCHARGE', id: 'a', orderId: '', reason: 'X', amount: '1.00', startedAt: '', dueAt: '' }] })).toBe(true)
    expect(hasDebt({ ...base, blocked: true })).toBe(true)
    expect(hasDebt({ ...base, pendingSurcharge: '0.01' })).toBe(true)
  })
})
