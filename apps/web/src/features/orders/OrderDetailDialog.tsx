import { useMemo, useRef, type ReactNode } from 'react'
import { useCoverageZones, zoneCovering } from '@/features/geo/coverage'
import { LazyMapCanvas } from '@/features/geo/LazyMapCanvas'
import { useDialog } from '@/shared/ui/dialog'
import { formatDate, formatDateTime, formatWindow } from './format'
import { statusStyles } from './statusStyles'
import { type Order, orderStatusLabels, reviewReasonLabels } from './types'

interface OrderDetailDialogProps {
  order: Order
  onClose: () => void
  /** Pasa a la revisión del pedido (solo se ofrece si está en revisión). */
  onReview: (order: Order) => void
}

const noop = () => undefined

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#557b7f]">{label}</dt>
      <dd className="text-xs text-[#061f23]">{children}</dd>
    </div>
  )
}

/**
 * Detalle completo de un pedido para el personal: datos de entrega, motivos de revisión si los hay,
 * y un mapa con el punto de entrega y la zona de cobertura que lo contiene.
 */
export function OrderDetailDialog({ order, onClose, onReview }: OrderDetailDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialog(dialogRef, dialogRef, onClose, false)
  const coverage = useCoverageZones()

  const point = useMemo(() => ({ latitude: order.latitude, longitude: order.longitude }), [order.latitude, order.longitude])
  const zones = coverage.data
  const zone = useMemo(() => (zones === undefined ? null : zoneCovering(point, zones)), [point, zones])
  // Un arreglo nuevo vuelve a encuadrar el mapa: solo cambia cuando cambia la zona.
  const fit = useMemo(() => zone?.ring ?? null, [zone])

  const zoneText = coverage.isError
    ? 'No se pudo cargar la cobertura.'
    : zones === undefined
    ? 'Buscando zona…'
    : zone === null
    ? 'Fuera de las zonas de cobertura'
    : `${zone.name} (${zone.code})`

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#002628]/60 backdrop-blur-xs sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#cce7ea] bg-white p-6 shadow-2xl outline-none sm:max-w-4xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#cce7ea] pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
              <span className="font-semibold">Dossier pedido · ficha de entrega</span>
            </div>
            <h2 id="order-detail-title" className="text-lg font-bold text-[#004b4e]">Detalle del pedido</h2>
          </div>
          <span className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${statusStyles[order.status]}`}>
            {orderStatusLabels[order.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-4 lg:grid-cols-2">
          <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-3">
            <div className="col-span-2"><Detail label="Dirección">{order.address}</Detail></div>
            <Detail label="Fecha de entrega">{formatDate(order.deliveryDate)}</Detail>
            <Detail label="Ventana">{formatWindow(order.windowStart, order.windowEnd)}</Detail>
            <div className="col-span-2"><Detail label="Referencia del lugar">{order.addressReference ?? 'Sin datos'}</Detail></div>
            <Detail label="Código postal">{order.postalCode ?? 'Sin datos'}</Detail>
            <Detail label="Teléfono de contacto">{order.contactPhone ?? 'Sin datos'}</Detail>
            <Detail label="Registrado">{formatDateTime(order.createdAt)}</Detail>
            <Detail label="Coordenadas">{`${order.latitude.toFixed(5)}, ${order.longitude.toFixed(5)}`}</Detail>
            <div className="col-span-2"><Detail label="Zona">{zoneText}</Detail></div>
            {order.reviewReasons.length > 0 ? (
              <div className="col-span-2">
                <Detail label="Motivos de revisión">
                  <ul className="flex flex-wrap gap-1.5">
                    {order.reviewReasons.map((reason) => (
                      <li key={reason} className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                        {reviewReasonLabels[reason]}
                      </li>
                    ))}
                  </ul>
                </Detail>
              </div>
            ) : null}
          </dl>

          <div className="overflow-hidden rounded-lg border border-[#cce7ea]">
            <LazyMapCanvas
              className="z-0 h-72 w-full lg:h-full lg:min-h-72"
              zones={zones ?? []}
              picked={point}
              highlight={zone?.ring ?? null}
              highlightHoles={zone?.holes ?? []}
              fitBounds={fit}
              focus={zone === null ? point : null}
              onMapClick={noop}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-[#cce7ea] pt-3">
          <button
            className="cursor-pointer rounded-lg border border-[#cce7ea] bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#004b4e] transition-colors hover:bg-[#e8f7f9]"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
          {order.status === 'PENDING_REVIEW' ? (
            <button
              className="cursor-pointer rounded-lg border border-[#004b4e] bg-[#004b4e] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#0a6568]"
              onClick={() => { onReview(order); }}
              type="button"
            >
              Revisar pedido
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
