import { boolean, object, oneOf, ParseError, string } from '../../api/parse'

/**
 * Customer balance (ADR 0006): surcharges for orders not delivered because of the customer, the simulated
 * charge and the block. Money arrives as a decimal string with two digits and stays a string: it never goes
 * through `number`.
 */

export const accountStatuses = ['ACTIVO', 'BLOQUEADO_POR_SALDO', 'BLOQUEADO_POR_INCIDENCIAS'] as const
export type AccountStatus = (typeof accountStatuses)[number]

export const balanceLineKinds = ['SURCHARGE', 'RECIDIVISM'] as const
export type BalanceLineKind = (typeof balanceLineKinds)[number]

export interface BalanceLine {
  kind: BalanceLineKind
  id: string
  /** The order that was not delivered. Empty for the extra (recidivism) charge. */
  orderId: string
  /** Closed code, translated with `balanceReasonLabel`. */
  reason: string
  amount: string
  /** RFC 3339, UTC: when the payment clock started. */
  startedAt: string
  /** RFC 3339, UTC: last moment to pay before the account is blocked. */
  dueAt: string
}

export interface MyBalance {
  pendingSurcharge: string
  accountStatus: AccountStatus
  /** true while the account is blocked for the balance: it cannot create or cancel orders. */
  blocked: boolean
  /** Always true: payments are simulated. */
  simulated: boolean
  lines: BalanceLine[]
}

/** Outcomes of the simulated charge. There is no "real" status: a charge is never shown as real. */
export const paymentStatuses = ['SIMULATED_APPROVED', 'SIMULATED_DECLINED'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export interface BalancePayment {
  status: PaymentStatus
  simulated: boolean
  amount: string
  reference: string
  /** true if this payment moved the account from BLOQUEADO_POR_SALDO back to ACTIVO. */
  unblocked: boolean
  createdAt: string
}

export function parseMyBalance(data: unknown): MyBalance {
  const o = object(data, 'balance')
  if (!Array.isArray(o.lines)) throw new ParseError('lines: expected array')
  return {
    pendingSurcharge: string(o, 'pendingSurcharge'),
    accountStatus: oneOf(o, 'accountStatus', accountStatuses),
    blocked: boolean(o, 'blocked'),
    simulated: boolean(o, 'simulated'),
    lines: o.lines.map((item: unknown) => parseLine(item)),
  }
}

function parseLine(item: unknown): BalanceLine {
  const o = object(item, 'balance line')
  return {
    kind: oneOf(o, 'kind', balanceLineKinds),
    id: string(o, 'id'),
    // The Gateway omits orderId on the extra charge.
    orderId: typeof o.orderId === 'string' ? o.orderId : '',
    reason: string(o, 'reason'),
    amount: string(o, 'amount'),
    startedAt: string(o, 'startedAt'),
    dueAt: string(o, 'dueAt'),
  }
}

export function parseBalancePayment(data: unknown): BalancePayment {
  const o = object(data, 'balance payment')
  return {
    status: oneOf(o, 'status', paymentStatuses),
    simulated: boolean(o, 'simulated'),
    amount: string(o, 'amount'),
    reference: string(o, 'reference'),
    unblocked: boolean(o, 'unblocked'),
    createdAt: string(o, 'createdAt'),
  }
}

const reasonLabels: Record<string, string> = {
  CLIENT_REFUSED: 'Rechazaste el pedido en la entrega',
  CLIENT_ABSENT: 'No estabas para recibir el pedido',
  OUT_OF_WINDOW: 'No estabas en la ventana de entrega',
  WRONG_ADDRESS: 'La dirección del pedido era incorrecta',
  RECIDIVISM: 'Recargo por reincidencia',
}

/** Readable reason. A new code is shown generically: never the raw code. */
export function balanceReasonLabel(reason: string): string {
  return reasonLabels[reason] ?? 'Recargo por una entrega no realizada'
}

/** "7.50" -> "$7.50". The amount already has two digits; it is not converted to number. */
export function formatMoney(amount: string): string {
  return `$${amount}`
}

/** Due date as DD/MM/YYYY from the contract's UTC day, so it does not depend on the device time zone. */
export function formatDueDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`
}

/** There is something to show: lines, a block or a balance above zero (never compared as a number). */
export function hasDebt(balance: MyBalance): boolean {
  return balance.lines.length > 0 || balance.blocked || /[1-9]/.test(balance.pendingSurcharge)
}
