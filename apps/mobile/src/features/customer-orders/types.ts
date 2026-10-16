import { isRecord, object, oneOf, enumArray, ParseError, string } from '../../api/parse'
import { validatePhone, validatePostalCode, validateReference } from '../contact/validation'

/** Order statuses (contracts/openapi/openapi.yaml, OrderStatus). */
export const orderStatuses = [
  'PENDING',
  'PENDING_REVIEW',
  'ROUTE_ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'NOT_DELIVERED',
  'CANCELLED',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PENDING_REVIEW: 'En revisión',
  ROUTE_ASSIGNED: 'Ruta asignada',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  NOT_DELIVERED: 'No entregado',
  CANCELLED: 'Cancelado',
}

export const reviewReasonValues = ['ZONE_NOT_COVERED', 'INVALID_WINDOW', 'CAPACITY_EXCEEDED', 'CUSTOMER_BLOCKED'] as const
export type ReviewReason = (typeof reviewReasonValues)[number]

export const reviewReasonLabels: Record<ReviewReason, string> = {
  ZONE_NOT_COVERED: 'Fuera de una zona atendida',
  INVALID_WINDOW: 'Ventana de entrega no válida',
  CAPACITY_EXCEEDED: 'Capacidad del día superada',
  CUSTOMER_BLOCKED: 'Cliente bloqueado',
}

export interface CustomerOrder {
  id: string
  address: string
  /** YYYY-MM-DD */
  deliveryDate: string
  /** HH:mm */
  windowStart: string
  windowEnd: string
  status: OrderStatus
  reviewReasons: ReviewReason[]
  /** RFC 3339, UTC. */
  createdAt: string
}

/** One product line of an order (contract: productId + quantity 1..50, no repeats). */
export interface OrderLine {
  productId: string
  quantity: number
}

export const MAX_LINE_QUANTITY = 50

/**
 * Creation payload. Coordinates are not collected on mobile (no map/geocoder yet), so the
 * future endpoint must geocode the address server side or the app must add a picker.
 * `notes` is UI-only: the contract has no such field, so it is never sent.
 */
export interface NewCustomerOrder {
  address: string
  addressReference: string
  /** Optional; an empty string means "not given" and is never sent. */
  postalCode?: string
  /** Normalized by the caller (no spaces, hyphens, dots or parentheses). */
  contactPhone: string
  deliveryDate: string
  windowStart: string
  windowEnd: string
  items: OrderLine[]
  notes?: string
}

/** Delivery windows offered to customers (ADR 0007). */
export const deliveryWindows = [
  { start: '09:00', end: '12:00', label: '09–12' },
  { start: '12:00', end: '15:00', label: '12–15' },
  { start: '15:00', end: '18:00', label: '15–18' },
  { start: '18:00', end: '21:00', label: '18–21' },
] as const

export function canCancel(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'ROUTE_ASSIGNED'
}

/** Statuses in which the order is moving and its state is worth polling. */
export function isActiveTransit(status: OrderStatus): boolean {
  return status === 'ROUTE_ASSIGNED' || status === 'PICKED_UP' || status === 'IN_TRANSIT'
}

export function isInProgress(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'PENDING_REVIEW' || isActiveTransit(status)
}

function isOnTheWay(status: OrderStatus): boolean {
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

export function orderCode(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

export function parseOrder(data: unknown): CustomerOrder {
  const o = object(data, 'order')
  // Coordinates sent by the future API are ignored: this client has no map.
  return {
    id: string(o, 'id'),
    address: string(o, 'address'),
    deliveryDate: string(o, 'deliveryDate'),
    windowStart: string(o, 'windowStart'),
    windowEnd: string(o, 'windowEnd'),
    status: oneOf(o, 'status', orderStatuses),
    reviewReasons: enumArray(o, 'reviewReasons', reviewReasonValues),
    createdAt: string(o, 'createdAt'),
  }
}

/** Accepts `{ orders: [...] }` (gateway envelope) or a bare array. */
export function parseMyOrders(data: unknown): CustomerOrder[] {
  const list = isRecord(data) && 'orders' in data ? data.orders : data
  if (!Array.isArray(list)) throw new ParseError('orders: expected array or { orders }')
  return list.map(parseOrder)
}

export function filterOrders(orders: readonly CustomerOrder[], query: string, status: OrderStatus | 'ALL'): CustomerOrder[] {
  const needle = query.trim().toLowerCase().replace(/^#/, '')
  return orders.filter((order) => {
    if (status !== 'ALL' && order.status !== status) return false
    if (needle === '') return true
    return order.address.toLowerCase().includes(needle) || orderCode(order.id).toLowerCase().includes(needle)
  })
}

const focusRank = (order: CustomerOrder): number =>
  isOnTheWay(order.status) ? 0 : order.status === 'ROUTE_ASSIGNED' ? 1 : order.status === 'PENDING' ? 2 : 3

/** The most relevant open order, or null when none is open. */
export function pickCurrentOrder(orders: readonly CustomerOrder[]): CustomerOrder | null {
  const open = orders.filter((o) => isInProgress(o.status))
  open.sort((a, b) => focusRank(a) - focusRank(b) || a.deliveryDate.localeCompare(b.deliveryDate))
  return open[0] ?? null
}

export interface OrderErrors {
  address?: string
  addressReference?: string
  postalCode?: string
  contactPhone?: string
  items?: string
  deliveryDate?: string
  window?: string
}

const MIN_ADDRESS_LENGTH = 5
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Local date as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${String(now.getFullYear())}-${m}-${d}`
}

function isRealDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
  return date.getFullYear() === y && date.getMonth() === (m ?? 1) - 1 && date.getDate() === d
}

/** `today` is a parameter so the date rule is deterministic in tests. */
export function validateNewOrder(input: NewCustomerOrder, today: string): OrderErrors {
  const errors: OrderErrors = {}
  if (input.address.trim().length < MIN_ADDRESS_LENGTH) {
    errors.address = `Escribe la dirección completa (mínimo ${String(MIN_ADDRESS_LENGTH)} caracteres).`
  }
  const reference = validateReference(input.addressReference)
  if (reference) errors.addressReference = reference
  const postal = validatePostalCode(input.postalCode ?? '')
  if (postal) errors.postalCode = postal
  const phone = validatePhone(input.contactPhone)
  if (phone) errors.contactPhone = phone
  if (input.items.length === 0) {
    errors.items = 'Elige al menos un producto.'
  } else if (
    input.items.some((line) => !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) ||
    new Set(input.items.map((line) => line.productId)).size !== input.items.length
  ) {
    errors.items = `Cada producto va una sola vez, de 1 a ${String(MAX_LINE_QUANTITY)} unidades.`
  }
  if (!isRealDate(input.deliveryDate)) errors.deliveryDate = 'Usa el formato AAAA-MM-DD, por ejemplo 2026-12-31.'
  else if (input.deliveryDate < today) errors.deliveryDate = 'La fecha de entrega no puede ser anterior a hoy.'
  if (!deliveryWindows.some((w) => w.start === input.windowStart && w.end === input.windowEnd)) {
    errors.window = 'Elige una ventana de entrega.'
  }
  return errors
}

export function formatWindow(start: string, end: string): string {
  return `${start.slice(0, 2)}–${end.slice(0, 2)} h`
}
