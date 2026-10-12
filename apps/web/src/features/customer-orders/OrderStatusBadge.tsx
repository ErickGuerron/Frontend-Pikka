import { orderStatusLabels, type OrderStatus } from './types'

const tone: Record<OrderStatus, string> = {
  PENDING: 'bg-surface-container text-on-surface-variant',
  PENDING_REVIEW: 'bg-amber-100 text-amber-900',
  ROUTE_ASSIGNED: 'bg-sky-100 text-sky-900',
  PICKED_UP: 'bg-secondary-container text-on-secondary-container',
  IN_TRANSIT: 'bg-secondary-container text-on-secondary-container',
  DELIVERED: 'bg-emerald-100 text-emerald-900',
  NOT_DELIVERED: 'bg-error-container text-on-error-container',
  CANCELLED: 'bg-error-container text-on-error-container',
}

/** Status shown as text (never color alone). */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      data-status={status}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tone[status]}`}
    >
      {orderStatusLabels[status]}
    </span>
  )
}
