import { isRecord, object, oneOf, ParseError, string } from '../../api/parse'
import { balanceReasonLabel, formatDueDate, formatMoney } from './balance'
import { reviewReasonLabels, reviewReasonValues, type ReviewReason } from './types'

/**
 * Notices for the customer: the review of their orders (ADR 0007, section 3) and the surcharge and the balance
 * block (ADR 0006, section 5). A kind this version does not know is ignored (see `parseNotifications`).
 */
export const notificationKinds = [
  'ORDER_IN_REVIEW',
  'ORDER_CONFIRMED',
  'ORDER_CORRECTED',
  'ORDER_REJECTED',
  'SURCHARGE_APPLIED',
  'ACCOUNT_BLOCKED_BY_BALANCE',
] as const
export type NotificationKind = (typeof notificationKinds)[number]

export interface CustomerNotification {
  id: string
  /** Empty for ACCOUNT_BLOCKED_BY_BALANCE: that notice belongs to the account, not to an order. */
  orderId: string
  kind: NotificationKind
  /**
   * Comma-separated reasons (ORDER_IN_REVIEW), the operator's audit reason, `REASON,AMOUNT,DUE_DATE`
   * (SURCHARGE_APPLIED) or empty (ACCOUNT_BLOCKED_BY_BALANCE).
   */
  detail: string
  /** RFC 3339, UTC. */
  createdAt: string
  read: boolean
}

const kindTitles: Record<NotificationKind, string> = {
  ORDER_IN_REVIEW: 'Tu pedido está en revisión',
  ORDER_CONFIRMED: 'Confirmamos tu pedido',
  ORDER_CORRECTED: 'Corregimos los datos de tu pedido',
  ORDER_REJECTED: 'Tu pedido no pudo registrarse',
  SURCHARGE_APPLIED: 'Se aplicó un recargo a tu cuenta',
  ACCOUNT_BLOCKED_BY_BALANCE: 'Tu cuenta quedó bloqueada por saldo pendiente',
}

export function notificationTitle(kind: NotificationKind): string {
  return kindTitles[kind]
}

/**
 * Readable detail: review reasons are translated, the operator's reason is shown as is, the surcharge is built from
 * its reason, amount and due date, and the block says how to get out of it.
 */
export function notificationDetail(notification: CustomerNotification): string {
  if (notification.kind === 'SURCHARGE_APPLIED') return surchargeDetail(notification.detail)
  if (notification.kind === 'ACCOUNT_BLOCKED_BY_BALANCE') return 'Paga tu saldo para volver a crear y cancelar pedidos.'
  if (notification.kind !== 'ORDER_IN_REVIEW') return notification.detail
  return notification.detail
    .split(',')
    .map((code) => code.trim())
    .filter((code): code is ReviewReason => (reviewReasonValues as readonly string[]).includes(code))
    .map((code) => reviewReasonLabels[code])
    .join(', ')
}

/** `REASON,AMOUNT,DUE_DATE` -> text. A malformed detail shows no raw text: it stays empty. */
function surchargeDetail(detail: string): string {
  const parts = detail.split(',').map((part) => part.trim())
  const [reason, amount, due] = parts
  if (parts.length !== 3 || !reason || !amount || !due) return ''
  return `${balanceReasonLabel(reason)}: ${formatMoney(amount)}. Pagar antes del ${formatDueDate(due)}.`
}

/**
 * Accepts `{ notifications: [...] }` from the Gateway. A notice of a kind this version does not know (one the
 * server started to send later) is ignored: it must not take the notices that are understood down with it.
 */
export function parseNotifications(data: unknown): CustomerNotification[] {
  if (!isRecord(data) || !Array.isArray(data.notifications)) throw new ParseError('notifications: expected { notifications }')
  return data.notifications.flatMap((item: unknown) => {
    const notification = parseNotification(item)
    return notification === null ? [] : [notification]
  })
}

function parseNotification(item: unknown): CustomerNotification | null {
  const o = object(item, 'notification')
  if (!isKnownKind(o.kind)) return null
  if (typeof o.read !== 'boolean') throw new ParseError('notification.read: expected boolean')
  return {
    id: string(o, 'id'),
    orderId: string(o, 'orderId'),
    kind: oneOf(o, 'kind', notificationKinds),
    detail: string(o, 'detail'),
    createdAt: string(o, 'createdAt'),
    read: o.read,
  }
}

function isKnownKind(value: unknown): boolean {
  return typeof value === 'string' && (notificationKinds as readonly string[]).includes(value)
}
