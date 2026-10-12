import { isRecord } from '@/shared/api/http'
import { ParseError } from '@/shared/api/parse'
import {
  orderStatuses,
  orderStatusLabels,
  parseOrders,
  reviewReasonLabels,
  type NewOrder,
  type Order,
  type OrderStatus,
} from '@/features/orders/types'

export { orderStatuses, orderStatusLabels, reviewReasonLabels }
export type { NewOrder, Order, OrderStatus }

/** An order as the customer sees it: the same schema, without driver data. */
export type CustomerOrder = Order

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

/** Accepts `{ orders: [...] }` (gateway envelope) or a bare array. */
export function parseMyOrders(data: unknown): CustomerOrder[] {
  if (isRecord(data) && 'orders' in data) return parseOrders(data.orders)
  if (Array.isArray(data)) return parseOrders(data)
  throw new ParseError('orders: expected array or { orders }')
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
