import { isRecord } from '@/shared/api/http'
import { ParseError } from '@/shared/api/parse'
import {
  orderStatuses,
  orderStatusLabels,
  parseOrder,
  reviewReasonLabels,
  type NewOrder,
  type Order,
  type OrderStatus,
} from '@/features/orders/types'

export { orderStatuses, orderStatusLabels, reviewReasonLabels }
export type { NewOrder, Order, OrderStatus }

/**
 * An order as the customer sees it: the shared schema plus the zone queue position.
 * queuePosition 0 = not waiting; >= 1 = FIFO position (1 = next) of a PENDING order without zone capacity.
 */
export interface CustomerOrder extends Order {
  queuePosition: number
}

/** Creation payload built by the form. `notes` is UI-only until the contract accepts it. */
export interface NewCustomerOrder extends NewOrder {
  notes?: string
}

/** Delivery windows offered to customers (ADR 0007). */
export const deliveryWindows = [
  { start: '09:00', end: '12:00', label: '09–12' },
  { start: '12:00', end: '15:00', label: '12–15' },
  { start: '15:00', end: '18:00', label: '15–18' },
  { start: '18:00', end: '21:00', label: '18–21' },
] as const

/** Customers can cancel only before the order is picked up. */
export function canCancel(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'ROUTE_ASSIGNED'
}

/** Statuses in which the order is moving and its state is worth polling. */
export function isActiveTransit(status: OrderStatus): boolean {
  return status === 'ROUTE_ASSIGNED' || status === 'PICKED_UP' || status === 'IN_TRANSIT'
}

/** Statuses of an order that is still open (not delivered, failed or cancelled). */
export function isInProgress(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'PENDING_REVIEW' || isActiveTransit(status)
}

/** Orders physically on their way to the customer. */
export function isOnTheWay(status: OrderStatus): boolean {
  return status === 'PICKED_UP' || status === 'IN_TRANSIT'
}

export const progressSteps = ['Confirmado', 'Preparado', 'En camino', 'Entregado'] as const

/** Index in `progressSteps` reached by the status, or -1 when the stepper does not apply. */
export function progressIndex(status: OrderStatus): number {
  switch (status) {
    case 'PENDING':
      return 0
    case 'ROUTE_ASSIGNED':
      return 1
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 2
    case 'DELIVERED':
      return 3
    default:
      return -1
  }
}

/** Short, human-friendly code for an order (first 8 characters of its id). */
export function orderCode(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

/** Missing or invalid queuePosition (old payloads, non-integer, negative) means "not waiting". */
function parseQueuePosition(data: unknown): number {
  const value = isRecord(data) ? data.queuePosition : undefined
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0
}

/** Shared order parser plus the customer-only queuePosition. */
export function parseCustomerOrder(data: unknown): CustomerOrder {
  return { ...parseOrder(data), queuePosition: parseQueuePosition(data) }
}

function parseCustomerOrders(data: unknown): CustomerOrder[] {
  if (!Array.isArray(data)) throw new ParseError('orders: expected array')
  return data.map((item) => parseCustomerOrder(item))
}

/** Accepts `{ orders: [...] }` (gateway envelope) or a bare array. */
export function parseMyOrders(data: unknown): CustomerOrder[] {
  if (isRecord(data) && 'orders' in data) return parseCustomerOrders(data.orders)
  if (Array.isArray(data)) return parseCustomerOrders(data)
  throw new ParseError('orders: expected array or { orders }')
}

/** Aviso de un pedido aceptado sin repartidor. queuePosition >= 1 means it waits for zone capacity. */
export function pendingDriverNotice(status: OrderStatus, queuePosition = 0): string | null {
  if (status !== 'PENDING') return null
  if (queuePosition >= 1) {
    return `Tu pedido es el #${String(queuePosition)} en espera. La zona tiene su cupo de envíos completo; se asignará a un repartidor de tu zona cuando se libere un envío.`
  }
  return 'Tu pedido está registrado. Lo asignaremos a un repartidor de tu zona cuando haya uno disponible.'
}

/** Pure filter: text matches address or code (with or without "#"), status is exact. */
export function filterOrders(orders: readonly CustomerOrder[], query: string, status: OrderStatus | 'ALL'): CustomerOrder[] {
  const needle = query.trim().toLowerCase().replace(/^#/, '')
  return orders.filter((order) => {
    if (status !== 'ALL' && order.status !== status) return false
    if (needle === '') return true
    return order.address.toLowerCase().includes(needle) || orderCode(order.id).toLowerCase().includes(needle)
  })
}

/** Lower rank = more relevant as "the order in progress". */
const focusRank = (order: CustomerOrder): number => (isOnTheWay(order.status) ? 0 : order.status === 'ROUTE_ASSIGNED' ? 1 : order.status === 'PENDING' ? 2 : 3)

/** The most relevant open order, or null when none is open. */
export function pickCurrentOrder(orders: readonly CustomerOrder[]): CustomerOrder | null {
  const open = orders.filter((o) => isInProgress(o.status))
  open.sort((a, b) => focusRank(a) - focusRank(b) || a.deliveryDate.localeCompare(b.deliveryDate))
  return open[0] ?? null
}
