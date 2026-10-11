import { useMemo, useRef, useState } from 'react'
import { isDemoMode, isServiceUnavailable } from './api'
import { CurrentOrderCard } from './CurrentOrderCard'
import { useMyOrders } from './hooks'
import { NewOrderDialog } from './NewOrderDialog'
import { OrderHistory } from './OrderHistory'
import { isOnTheWay, pickCurrentOrder, type CustomerOrder } from './types'

export function MyOrdersPage() {
  const orders = useMyOrders()
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const list = orders.data

  const current = useMemo(() => {
    if (list === undefined) return null
    return list.find((o) => o.id === selectedId) ?? pickCurrentOrder(list)
  }, [list, selectedId])
  const history = useMemo(
    () => (list ?? []).filter((o) => o.id !== current?.id).sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate)),
    [list, current],
  )
  const onTheWay = (list ?? []).filter((o) => isOnTheWay(o.status)).length

  const onCreated = (order: CustomerOrder) => {
    setCreating(false)
    setSelectedId(order.id)
    setNotice(
      order.status === 'PENDING_REVIEW'
        ? 'Recibimos tu pedido, pero quedó en revisión: un operador lo revisará porque la dirección está fuera de la zona atendida o requiere validación.'
        : 'Pedido creado. Te mostramos su estado a continuación.',
    )
  }

  return (
    <div ref={topRef} className="mx-auto flex max-w-5xl flex-col gap-6 py-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-on-surface">Mis Pedidos</h1>
          {onTheWay > 0 ? (
            <span className="rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-secondary-container">
              {onTheWay} {onTheWay === 1 ? 'pedido en camino' : 'pedidos en camino'}
            </span>
          ) : null}
          {isDemoMode() ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-900">
              DEMO · datos simulados
            </span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={orders.isError}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => { setCreating(true) }}
        >
          Hacer nuevo pedido
        </button>
      </header>

      {notice !== null ? (
        <p role="status" className="flex items-start justify-between gap-3 rounded-lg bg-secondary-container/60 px-4 py-3 text-sm text-on-secondary-container">
          <span>{notice}</span>
          <button type="button" aria-label="Cerrar aviso" className="cursor-pointer font-bold" onClick={() => { setNotice(null) }}>
            ×
          </button>
        </p>
      ) : null}

      {orders.isPending ? (
        <p role="status" className="text-sm text-on-surface-variant">
          Cargando tus pedidos…
        </p>
      ) : orders.isError ? (
        <ErrorState unavailable={isServiceUnavailable(orders.error)} onRetry={() => void orders.refetch()} />
      ) : (list ?? []).length === 0 ? (
        <section className="rounded-2xl border border-dashed border-surface-container-high bg-surface-container-lowest p-8 text-center">
          <h2 className="text-lg font-bold text-on-surface">Aún no tienes pedidos</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Haz tu primer pedido y sigue su estado desde aquí.</p>
        </section>
      ) : (
        <>
          {current !== null ? <CurrentOrderCard key={current.id} order={current} /> : null}
          <OrderHistory
            orders={history}
            onSelect={(order) => {
              setSelectedId(order.id)
              topRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </>
      )}

      {creating ? <NewOrderDialog onClose={() => { setCreating(false) }} onCreated={onCreated} /> : null}
    </div>
  )
}

function ErrorState({ unavailable, onRetry }: { unavailable: boolean; onRetry: () => void }) {
  return (
    <section role="alert" className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-8 text-center">
      <h2 className="text-lg font-bold text-on-surface">
        {unavailable ? 'El servicio de pedidos aún no está disponible' : 'No pudimos cargar tus pedidos.'}
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        {unavailable ? 'Estamos terminando esta función. Vuelve a intentarlo más tarde.' : 'Revisa tu conexión e inténtalo de nuevo.'}
      </p>
      <button
        type="button"
        className="mt-4 cursor-pointer rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </section>
  )
}
