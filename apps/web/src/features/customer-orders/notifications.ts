import { isRecord } from '@/shared/api/http'
import { object, oneOf, ParseError, string } from '@/shared/api/parse'
import { reviewReasonLabels, type ReviewReason, reviewReasonValues } from '@/features/orders/types'

/** Avisos al cliente sobre la revisión de sus pedidos (ADR 0007, sección 3). */
export const notificationKinds = ['ORDER_IN_REVIEW', 'ORDER_CONFIRMED', 'ORDER_CORRECTED', 'ORDER_REJECTED'] as const
export type NotificationKind = (typeof notificationKinds)[number]

export interface CustomerNotification {
  id: string
  orderId: string
  kind: NotificationKind
  /** Motivos separados por coma (ORDER_IN_REVIEW) o motivo de auditoría del operador. */
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
}

export function notificationTitle(kind: NotificationKind): string {
  return kindTitles[kind]
}

/** Texto legible del detalle: los motivos se traducen; el motivo del operador se muestra tal cual. */
export function notificationDetail(notification: CustomerNotification): string {
  if (notification.kind !== 'ORDER_IN_REVIEW') return notification.detail
  return notification.detail
    .split(',')
    .map((code) => code.trim())
    .filter((code): code is ReviewReason => (reviewReasonValues as readonly string[]).includes(code))
    .map((code) => reviewReasonLabels[code])
    .join(', ')
}

/** Acepta `{ notifications: [...] }` del Gateway. */
export function parseNotifications(data: unknown): CustomerNotification[] {
  if (!isRecord(data) || !Array.isArray(data.notifications)) throw new ParseError('notifications: expected { notifications }')
  return data.notifications.map((item) => parseNotification(item))
}

function parseNotification(item: unknown): CustomerNotification {
  const o = object(item, 'notification')
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
