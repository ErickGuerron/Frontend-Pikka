import { scheduledOrderNotice } from '../../../../shared/customer-orders/schedule'
import { useMemo, useState } from 'react'
import { LazyMapCanvas } from '@/features/geo/LazyMapCanvas'
import { localToday } from '@/features/orders/validation'
import { formatDate, formatWindow } from '@/features/orders/format'
import { cancelBlockedMessage } from './balance'
import { CancelOrderDialog } from './CancelOrderDialog'
import { EditOrderDialog } from './EditOrderDialog'
import { isDemoMode } from './api'
import { useMyBalance, useOrderTracking } from './hooks'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderStepper } from './OrderStepper'
import { canCancel, isInProgress, isOnTheWay, orderCode, pendingDriverNotice, reviewReasonLabels, type CustomerOrder } from './types'

const noop = () => undefined

/** Tarjeta destacada del pedido activo o seleccionado con telemetría en vivo */
export function CurrentOrderCard({ order }: { order: CustomerOrder }) {
  const [cancelling, setCancelling] = useState(false)
  const [editing, setEditing] = useState(false)
  const blocked = useMyBalance().data?.blocked === true
  const point = useMemo(
    () => ({ latitude: order.latitude, longitude: order.longitude }),
    [order.latitude, order.longitude],
  )
  const { data: tracking, isError } = useOrderTracking(order)
  const live = !isError && tracking?.orderId === order.id && isOnTheWay(tracking.status) && isOnTheWay(order.status)
    ? tracking
    : null
  const bounds = useMemo(
    () => live?.driverPosition ? [point, live.driverPosition, ...live.road] : null,
    [point, live],
  )
  const notice = order.status === 'PENDING' && order.queuePosition === 0 && order.deliveryDate > localToday()
    ? scheduledOrderNotice(formatDate(order.deliveryDate), formatWindow(order.windowStart, order.windowEnd))
    : pendingDriverNotice(order.status, order.queuePosition)

  const isAccepted = order.status !== 'PENDING' && order.status !== 'PENDING_REVIEW'

  return (
    <section
      aria-labelledby="current-order-title"
      className="relative overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 sm:p-7 shadow-sm transition-shadow"
    >
      {/* Tonal ambient glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-secondary-fixed/25 blur-3xl" />

      {/* Header del Despacho Activo */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-low pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 font-mono text-[11px] font-bold text-primary">
            <span className={`h-2 w-2 rounded-full ${isAccepted ? 'bg-secondary animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {isInProgress(order.status)
                ? (isAccepted ? 'DESPACHO ACTIVO' : 'PEDIDO RECIBIDO · ASIGNANDO')
                : 'DETALLE DEL PEDIDO'}{' '}
              {'// REF '}{orderCode(order.id)}
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">schedule</span>
            <span>Entrega: {formatDate(order.deliveryDate)} · {formatWindow(order.windowStart, order.windowEnd)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Main Grid: Info + Telemetría */}
      <div className="relative z-10 grid grid-cols-1 gap-6 pt-5 lg:grid-cols-12">
        {/* Columna Izquierda: Información de ruta, stepper y métricas */}
        <div className="flex flex-col justify-between space-y-5 lg:col-span-7">
          <div>
            <h2 id="current-order-title" className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface font-sans">
              {isInProgress(order.status) ? 'Pedido en Curso' : 'Detalle del pedido'}{' '}
              <span className="font-mono text-base font-normal text-on-surface-variant">{orderCode(order.id)}</span>
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-on-surface-variant sm:text-sm">
              <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">home_pin</span>
              <span className="font-semibold text-on-surface">{order.address}</span>
            </p>
          </div>

          {/* Stepper / Aviso de Revisión */}
          <div>
            {notice !== null ? (
              <p role="status" className="mb-3 rounded-xl border border-surface-container-high bg-surface-container-low p-4 text-sm text-on-surface">
                {notice}
              </p>
            ) : null}
            {order.status === 'ROUTE_ASSIGNED' ? (
              <p role="status" className="mb-3 rounded-xl border border-surface-container-high bg-surface-container-low p-4 text-sm text-on-surface">
                Tu pedido está asignado a un repartidor; aún no sale del local.
              </p>
            ) : null}
            {order.status === 'PENDING_REVIEW' ? (
              <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Tu pedido está en revisión por un operador.</p>
                <p className="mt-1">Lo confirmaremos o te pediremos ajustar los datos. No necesitas hacer nada por ahora.</p>
                {order.reviewReasons.length > 0 ? (
                  <p className="mt-1.5 text-xs font-mono">
                    Motivo: {order.reviewReasons.map((reason) => reviewReasonLabels[reason]).join(', ')}.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl bg-surface-container-low/70 p-4 border border-surface-container">
                <OrderStepper status={order.status} />
              </div>
            )}
          </div>

          {live && (live.eta || live.stopsBefore !== null) ? (
            <div className="flex flex-wrap gap-4 text-sm text-on-surface">
              {live.eta ? <span>Llegada estimada en {Math.ceil(live.eta.durationSeconds / 60)} min</span> : null}
              {live.stopsBefore != null ? <span>Paradas antes de tu entrega: {live.stopsBefore}</span> : null}
            </div>
          ) : null}

          {/* Botón de Cancelación si aplica */}
          {canCancel(order.status) ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!isDemoMode() ? (
                <button type="button" className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary" onClick={() => { setEditing(true) }}>
                  Editar pedido
                </button>
              ) : null}
              <button
                type="button"
                disabled={blocked}
                className="cursor-pointer rounded-lg border border-error px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-error hover:bg-error-container transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => { setCancelling(true) }}
              >
                Cancelar pedido
              </button>
              {blocked ? <p className="mt-2 text-xs text-on-surface-variant">{cancelBlockedMessage}</p> : null}
            </div>
          ) : null}
        </div>

        {/* Columna Derecha: Mapa telemétrico interactivo */}
        <div className="flex flex-col lg:col-span-5">
          <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-xl border border-surface-container bg-surface-container-high/60 shadow-inner [&_.leaflet-container]:h-full!">
            <div aria-label={live?.driverPosition ? 'Mapa del repartidor y punto de entrega' : 'Mapa del punto de entrega'} className="absolute inset-0 h-full w-full">
              <LazyMapCanvas
                picked={point}
                focus={bounds === null ? point : null}
                fitBounds={bounds}
                driverPosition={live?.driverPosition ?? null}
                road={live?.road ?? []}
                onMapClick={noop}
              />
            </div>
          </div>
        </div>
      </div>

      {editing && canCancel(order.status) ? <EditOrderDialog key={order.id} order={order} onClose={() => { setEditing(false) }} /> : null}
      {cancelling ? <CancelOrderDialog order={order} onClose={() => { setCancelling(false) }} /> : null}
    </section>
  )
}
