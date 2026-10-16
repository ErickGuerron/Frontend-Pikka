import { useState } from 'react'
import { LazyMapCanvas } from '@/features/geo/LazyMapCanvas'
import { formatDate, formatWindow } from '@/features/orders/format'
import { CancelOrderDialog } from './CancelOrderDialog'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderStepper } from './OrderStepper'
import { canCancel, isInProgress, orderCode, reviewReasonLabels, type CustomerOrder } from './types'

const noop = () => undefined

/** Genera un PIN determinista de 4 dígitos basado en el ID para confirmación */
function getPin(id: string): string {
  const digits = id.replace(/\D/g, '')
  if (digits.length >= 4) {
    return `${digits.charAt(0)} ${digits.charAt(1)} ${digits.charAt(2)} ${digits.charAt(3)}`
  }
  const hash = Math.abs(id.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0))
  const pinStr = String(1000 + (hash % 9000))
  return `${pinStr.charAt(0)} ${pinStr.charAt(1)} ${pinStr.charAt(2)} ${pinStr.charAt(3)}`
}

/** Tarjeta destacada del pedido activo o seleccionado con telemetría en vivo */
export function CurrentOrderCard({ order }: { order: CustomerOrder }) {
  const [cancelling, setCancelling] = useState(false)
  const [copied, setCopied] = useState(false)
  const point = { latitude: order.latitude, longitude: order.longitude }
  const pin = getPin(order.id)

  const copyPin = () => {
    void navigator.clipboard.writeText(pin.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => { setCopied(false) }, 2000)
  }

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
              // REF {orderCode(order.id)}
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">schedule</span>
            <span>Entrega: {formatDate(order.deliveryDate)} · {formatWindow(order.windowStart, order.windowEnd)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-mono text-xs text-on-surface-variant">Prioridad Flota Eléctrica</span>
          <div className="flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 font-mono text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-[16px] text-secondary" aria-hidden="true">bolt</span>
            <span>EXPRESS COLD-CHAIN</span>
          </div>
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
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">store</span>
              <span className="font-medium">Hub Providencia (Cocina Central)</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_right_alt</span>
              <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">home_pin</span>
              <span className="font-semibold text-on-surface">{order.address}</span>
            </p>
          </div>

          {/* Stepper / Aviso de Revisión */}
          <div>
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

          {/* Métricas técnicas */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-3">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Llegada ETA</span>
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">timelapse</span>
              </div>
              <div className="mt-2">
                {isAccepted ? (
                  <>
                    <span className="font-sans text-xl font-bold text-primary">~20</span>{' '}
                    <span className="font-mono text-xs text-on-surface-variant">MIN</span>
                  </>
                ) : (
                  <span className="font-mono text-base font-bold text-on-surface-variant">Pendiente</span>
                )}
              </div>
              <span className="mt-1 font-mono text-[11px] font-medium text-secondary">
                {isAccepted ? 'Tráfico Óptimo' : 'Por calcular'}
              </span>
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-3">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Repartidor</span>
                <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                  {isAccepted ? 'two_wheeler' : 'person_search'}
                </span>
              </div>
              <div className="mt-2">
                {isAccepted ? (
                  <>
                    <p className="truncate font-sans text-sm font-semibold text-on-surface">Lucas M.</p>
                    <span className="font-mono text-[10px] text-on-surface-variant">FLOTA PIKKA #09</span>
                  </>
                ) : (
                  <>
                    <p className="truncate font-sans text-sm font-semibold text-on-surface-variant">Por asignar</p>
                    <span className="font-mono text-[10px] text-on-surface-variant">OPERADOR EN RUTA</span>
                  </>
                )}
              </div>
              {isAccepted ? (
                <span className="mt-1 flex items-center gap-0.5 text-[11px] font-bold text-amber-800">
                  ★ 4.96 (1,240)
                </span>
              ) : (
                <span className="mt-1 font-mono text-[11px] text-[#557b7f]">En cola de operador</span>
              )}
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-3">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Cabina Fría</span>
                <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">ac_unit</span>
              </div>
              <div className="mt-2">
                <span className="font-sans text-xl font-bold text-primary">{isAccepted ? '4.1' : '4.0'}</span>{' '}
                <span className="font-mono text-xs text-on-surface-variant">°C</span>
              </div>
              <span className="mt-1 font-mono text-[11px] text-secondary">
                {isAccepted ? 'Rango ideal 2°–6°' : 'Empaque isotérmico'}
              </span>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-secondary/20 bg-secondary-fixed/20 p-3">
              <div className="flex items-center justify-between text-on-surface">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">PIN Entrega</span>
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                  {isAccepted ? 'lock' : 'lock_clock'}
                </span>
              </div>
              <div className="mt-1">
                {isAccepted ? (
                  <>
                    <span className="block font-mono text-lg font-bold tracking-widest text-primary">{pin}</span>
                    <span className="block text-[10px] text-on-surface-variant">Muestra al recibir</span>
                  </>
                ) : (
                  <>
                    <span className="block font-mono text-lg font-bold tracking-widest text-on-surface-variant/70">· · · ·</span>
                    <span className="block text-[10px] text-on-surface-variant">Disponible al despachar</span>
                  </>
                )}
              </div>
              {isAccepted ? (
                <button
                  type="button"
                  onClick={copyPin}
                  className="mt-1 cursor-pointer text-left font-mono text-[11px] font-bold text-primary underline hover:text-secondary"
                >
                  {copied ? '¡Copiado!' : 'Copiar código'}
                </button>
              ) : (
                <span className="mt-1 block font-mono text-[11px] text-on-surface-variant/70 italic">
                  Se activará en ruta
                </span>
              )}
            </div>
          </div>

          {/* Botón de Cancelación si aplica */}
          {canCancel(order.status) ? (
            <div className="pt-1">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-error px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-error hover:bg-error-container transition-colors"
                onClick={() => { setCancelling(true) }}
              >
                Cancelar pedido
              </button>
            </div>
          ) : null}
        </div>

        {/* Columna Derecha: Mapa telemétrico interactivo */}
        <div className="flex flex-col lg:col-span-5">
          <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-xl border border-surface-container bg-surface-container-high/60 shadow-inner [&_.leaflet-container]:h-full!">
            {/* Mapa Leaflet interactivo */}
            <div aria-label="Mapa del punto de entrega" className="absolute inset-0 h-full w-full">
              <LazyMapCanvas picked={point} focus={point} onMapClick={noop} />
            </div>

            {/* Overlay superior de telemetría */}
            <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-surface-container-lowest/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary shadow-xs backdrop-blur-sm">
                <span className={`h-1.5 w-1.5 rounded-full ${isAccepted ? 'bg-secondary animate-pulse' : 'bg-amber-500'}`} />
                <span>{isAccepted ? 'SENSOR GPS: ACTIVO ±2.4m' : 'TELEMETRÍA: EN ESPERA DE ASIGNACIÓN'}</span>
              </span>
              <span className="inline-flex items-center rounded bg-surface-container-lowest/90 px-2 py-0.5 font-mono text-[10px] text-on-surface-variant shadow-xs backdrop-blur-sm">
                {isAccepted ? 'Batería Pikka-09: 88%' : 'Hub Providencia Central'}
              </span>
            </div>

            {/* Overlay inferior con contacto del repartidor o estado de asignación */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between rounded-xl bg-surface-container-lowest/95 p-2 px-3 shadow-md backdrop-blur-md">
              {isAccepted ? (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-white">
                      LM
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-on-surface">Lucas Morales</p>
                      <p className="truncate text-[10px] text-on-surface-variant">Despachador oficial asignado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Llamar al repartidor"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container text-primary hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">call</span>
                    </button>
                    <button
                      type="button"
                      title="Enviar instrucciones"
                      className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-medium text-white hover:bg-primary-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">chat</span>
                      <span>Instrucción</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#004b4e] text-[#2dd4bf]">
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">hub</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-on-surface">Central de Operaciones Pikka</p>
                      <p className="truncate text-[10px] text-on-surface-variant">Asignando ruta y despachador oficial…</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e8f7f9] text-[#004b4e] font-mono text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    En cola
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Leyenda del radar de ruta */}
          <div className="mt-2 flex items-center justify-between px-1 font-mono text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" /> Hub Salida
            </span>
            {isAccepted ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-secondary-fixed-dim" /> Posición Repartidor
              </span>
            ) : (
              <span className="flex items-center gap-1 text-on-surface-variant/60">
                <span className="h-2 w-2 rounded-full bg-outline-variant" /> Repartidor (por asignar)
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-tertiary-container" /> Tu Casa
            </span>
          </div>
        </div>
      </div>

      {cancelling ? <CancelOrderDialog order={order} onClose={() => { setCancelling(false) }} /> : null}
    </section>
  )
}
