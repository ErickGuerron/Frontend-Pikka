import { useState } from 'react'
import { LazyMapCanvas } from '@/features/geo/LazyMapCanvas'
import { formatDate, formatWindow } from '@/features/orders/format'
import { CancelOrderDialog } from './CancelOrderDialog'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderStepper } from './OrderStepper'
import { canCancel, isInProgress, orderCode, reviewReasonLabels, type CustomerOrder } from './types'

const noop = () => undefined

/** The order in focus: status, stepper, delivery details, map pin and (when allowed) cancel. */
export function CurrentOrderCard({ order }: { order: CustomerOrder }) {
  const [cancelling, setCancelling] = useState(false)
  const point = { latitude: order.latitude, longitude: order.longitude }

  return (
    <section aria-labelledby="current-order-title" className="rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="current-order-title" className="text-lg font-bold text-on-surface">
          {isInProgress(order.status) ? 'Pedido en Curso' : 'Detalle del pedido'}{' '}
          <span className="font-mono text-base text-on-surface-variant">{orderCode(order.id)}</span>
        </h2>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-5">
        {order.status === 'PENDING_REVIEW' ? (
          <div role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Tu pedido está en revisión por un operador.</p>
            <p>Lo confirmaremos o te pediremos ajustar los datos. No necesitas hacer nada por ahora.</p>
            {order.reviewReasons.length > 0 ? (
              <p className="mt-1 text-xs">Motivo: {order.reviewReasons.map((reason) => reviewReasonLabels[reason]).join(', ')}.</p>
            ) : null}
          </div>
        ) : (
          <OrderStepper status={order.status} />
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Entrega</h3>
            <p className="text-sm font-semibold text-on-surface">
              {formatDate(order.deliveryDate)} · {formatWindow(order.windowStart, order.windowEnd)}
            </p>
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Dirección de entrega</h3>
            <p className="text-sm text-on-surface">{order.address}</p>
          </div>
          {canCancel(order.status) ? (
            <div>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error hover:bg-error-container"
                onClick={() => { setCancelling(true) }}
              >
                Cancelar pedido
              </button>
            </div>
          ) : null}
        </div>
        <div
          aria-label="Mapa del punto de entrega"
          className="h-56 overflow-hidden rounded-xl border border-surface-container-high [&_.leaflet-container]:h-full!"
        >
          <LazyMapCanvas picked={point} focus={point} onMapClick={noop} />
        </div>
      </div>

      {cancelling ? <CancelOrderDialog order={order} onClose={() => { setCancelling(false) }} /> : null}
    </section>
  )
}
