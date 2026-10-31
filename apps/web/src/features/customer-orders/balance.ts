import { boolean, object, oneOf, ParseError, string } from '@/shared/api/parse'

/**
 * Saldo del cliente (ADR 0006): recargos por no entregar por su culpa, el cobro simulado y el bloqueo.
 * El dinero llega como texto decimal con dos decimales y se queda como texto: nunca pasa por `number`.
 */

export const accountStatuses = ['ACTIVO', 'BLOQUEADO_POR_SALDO', 'BLOQUEADO_POR_INCIDENCIAS'] as const
export type AccountStatus = (typeof accountStatuses)[number]

export const balanceLineKinds = ['SURCHARGE', 'RECIDIVISM', 'REASSIGNMENT'] as const
export type BalanceLineKind = (typeof balanceLineKinds)[number]

export interface BalanceLine {
  kind: BalanceLineKind
  id: string
  /** Pedido que no se entregó. Vacío en el recargo extra. */
  orderId: string
  /** Código cerrado que se traduce con `balanceReasonLabel`. */
  reason: string
  amount: string
  /** RFC 3339, UTC: cuándo empezó el plazo de pago. */
  startedAt: string
  /** RFC 3339, UTC: último momento para pagar antes del bloqueo. */
  dueAt: string
}

export interface MyBalance {
  pendingSurcharge: string
  accountStatus: AccountStatus
  /** true mientras la cuenta está bloqueada por saldo: no puede crear ni cancelar pedidos. */
  blocked: boolean
  /** Siempre true: los pagos son simulados. */
  simulated: boolean
  lines: BalanceLine[]
}

/** Resultados del cobro simulado. No existe un estado "real": nunca se presenta un cargo como verdadero. */
export const paymentStatuses = ['SIMULATED_APPROVED', 'SIMULATED_DECLINED'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export interface BalancePayment {
  status: PaymentStatus
  simulated: boolean
  amount: string
  reference: string
  /** true si este pago devolvió la cuenta de BLOQUEADO_POR_SALDO a ACTIVO. */
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
    lines: o.lines.map((item) => parseLine(item)),
  }
}

function parseLine(item: unknown): BalanceLine {
  const o = object(item, 'balance line')
  return {
    kind: oneOf(o, 'kind', balanceLineKinds),
    id: string(o, 'id'),
    // El Gateway omite orderId en el recargo extra.
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
  REASSIGNMENT: 'Cobro por cambio de entrega',
}

/** Texto legible del motivo. Un código nuevo se muestra genérico: nunca el código crudo. */
export function balanceReasonLabel(reason: string): string {
  return reasonLabels[reason] ?? 'Recargo por una entrega no realizada'
}

/** "7.50" -> "$7.50". El monto ya viene con dos decimales; no se convierte a number. */
export function formatMoney(amount: string): string {
  return `$${amount}`
}

/** Fecha límite como DD/MM/AAAA, tomada del día UTC del contrato para no depender de la zona del navegador. */
export function formatDueDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`
}

/** Hay algo que mostrar: líneas, un bloqueo o un saldo mayor que cero (sin comparar como número). */
/** Lo que ve el cliente cuando la cuenta bloqueada por saldo le impide cancelar. */
export const cancelBlockedMessage = 'Paga tu saldo pendiente para volver a cancelar pedidos.'

export function hasDebt(balance: MyBalance): boolean {
  return balance.lines.length > 0 || balance.blocked || /[1-9]/.test(balance.pendingSurcharge)
}
