import { isRecord } from '@/shared/api/http'
import { object, oneOf, ParseError, string } from '@/shared/api/parse'
import { reviewReasonLabels, type ReviewReason, reviewReasonValues } from '@/features/orders/types'
import { balanceReasonLabel, formatDueDate, formatMoney } from './balance'

/**
 * Avisos al cliente: la revisión de sus pedidos (ADR 0007, sección 3) y el recargo y el bloqueo por saldo (ADR 0006,
 * sección 5). Un tipo que esta versión no conoce se ignora (ver `parseNotifications`).
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
  orderId: string
  kind: NotificationKind
  /**
   * Motivos separados por coma (ORDER_IN_REVIEW), motivo de auditoría del operador, `MOTIVO,MONTO,FECHA_LIMITE`
   * (SURCHARGE_APPLIED) o vacío (ACCOUNT_BLOCKED_BY_BALANCE).
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
 * Texto legible del detalle: los motivos se traducen; el motivo del operador se muestra tal cual; el recargo se arma con
 * su motivo, monto y fecha límite; el bloqueo explica cómo salir de él.
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

/** `MOTIVO,MONTO,FECHA_LIMITE` -> texto. Un detalle mal formado no muestra texto crudo: queda vacío. */
function surchargeDetail(detail: string): string {
  const parts = detail.split(',').map((part) => part.trim())
  const [reason, amount, due] = parts
  if (parts.length !== 3 || !reason || !amount || !due) return ''
  return `${balanceReasonLabel(reason)}: ${formatMoney(amount)}. Pagar antes del ${formatDueDate(due)}.`
}

/**
 * Acepta `{ notifications: [...] }` del Gateway. Un aviso de un tipo que esta versión no conoce (por ejemplo, uno que el
 * servidor estrenó después) se ignora: no debe llevarse consigo los avisos que sí se entienden.
 */
export function parseNotifications(data: unknown): CustomerNotification[] {
  if (!isRecord(data) || !Array.isArray(data.notifications)) throw new ParseError('notifications: expected { notifications }')
  return data.notifications.flatMap((item) => {
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
