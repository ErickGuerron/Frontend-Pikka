import { useMemo, useRef, useState } from 'react'
import { useCurrentUser } from '@/features/auth/hooks'
import pikkaNutria from '@/assets/pikka.png'
import { isDemoMode, isServiceUnavailable } from './api'
import { BalanceCard } from './BalanceCard'
import { CurrentOrderCard } from './CurrentOrderCard'
import { GuaranteeBanner, QuickFavoritesSection } from './CustomerSections'
import { useMyBalance, useMyOrders } from './hooks'
import { NewOrderDialog } from './NewOrderDialog'
import { NoActiveDeliveryCard } from './NoActiveDeliveryCard'
import { NotificationsPanel } from './NotificationsPanel'
import { OrderHistory } from './OrderHistory'
import { isInProgress, isOnTheWay, pickCurrentOrder, type CustomerOrder } from './types'

export function MyOrdersPage() {
  const orders = useMyOrders()
  // Una cuenta bloqueada por saldo no puede crear pedidos (ADR 0006, sección 5); el servidor también lo rechaza.
  const blocked = useMyBalance().data?.blocked === true
  const { data: user } = useCurrentUser()
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const list = orders.data

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Cliente'

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
    <div ref={topRef} className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* HEADER DE BIENVENIDA & ACCIONES */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 rounded-2xl border border-[#cce7ea] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl border border-[#cce7ea] bg-[#e8f7f9] p-2 shadow-xs flex items-center justify-center">
            <img
              src={pikkaNutria}
              alt="Pikka Nutria Mascota"
              className="h-full w-full object-contain"
            />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2dd4bf] opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#006b5f]" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e8f7f9] border border-[#cce7ea] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#006b5f]">
                TELEMETRÍA EN DIRECTO
              </span>
              <span className="font-mono text-[11px] text-[#557b7f]">
                Sincronizado: tiempo real
              </span>
              {onTheWay > 0 ? (
                <span className="rounded-full font-mono px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#e8f7f9] text-[#006b5f] border border-[#cce7ea]">
                  {onTheWay} {onTheWay === 1 ? 'pedido en camino' : 'pedidos en camino'}
                </span>
              ) : null}
              {isDemoMode() ? (
                <span className="rounded-full font-mono px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  DEMO · datos simulados
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#004b4e] font-sans">
              Mis Pedidos
            </h1>
            <p className="text-xs sm:text-sm text-[#557b7f] max-w-2xl leading-relaxed">
              Hola, <span className="font-semibold text-[#004b4e]">{firstName}</span>. Gestiona tus entregas express, rastrea pedidos en curso con control de frío o solicita un nuevo despacho con empaque isotérmico inteligente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-end shrink-0">
          <button
            type="button"
            aria-label="Hacer nuevo pedido"
            disabled={orders.isError || blocked}
            title={blocked ? 'Tu cuenta está bloqueada por saldo pendiente' : undefined}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#004b4e] hover:bg-[#0a6568] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#004b4e] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => { setCreating(true) }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_circle</span>
            <span>Hacer nuevo pedido</span>
          </button>
        </div>
      </header>

      <NotificationsPanel />

      <BalanceCard />

      {notice !== null ? (
        <p role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#cce7ea] bg-[#e8f7f9] px-4 py-3 text-sm text-[#004b4e] font-medium shadow-xs">
          <span>{notice}</span>
          <button type="button" aria-label="Cerrar aviso" className="cursor-pointer font-bold text-lg leading-none" onClick={() => { setNotice(null) }}>
            ×
          </button>
        </p>
      ) : null}

      {orders.isPending ? (
        <p role="status" className="font-mono text-sm text-[#557b7f]">
          Cargando tus pedidos…
        </p>
      ) : orders.isError ? (
        <ErrorState unavailable={isServiceUnavailable(orders.error)} onRetry={() => void orders.refetch()} />
      ) : (
        <>
          {/* SECCIÓN DESTACADA: DESPACHO ACTIVO O DETALLE SELECCIONADO O ESTADO VACÍO */}
          {current !== null && (selectedId !== null || isInProgress(current.status)) ? (
            <CurrentOrderCard key={current.id} order={current} />
          ) : (
            <NoActiveDeliveryCard
              onNewOrder={() => { setCreating(true) }}
              onViewHistory={() => { historyRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
              hasAnyOrders={(list ?? []).length > 0}
            />
          )}

          {/* SECCIÓN: HISTORIAL DE PEDIDOS */}
          <div ref={historyRef}>
            <OrderHistory
              orders={history}
              onSelect={(order) => {
                setSelectedId(order.id)
                topRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          </div>

          {/* SECCIÓN RÁPIDA: FAVORITOS RECURRENTES */}
          <QuickFavoritesSection onNewOrder={() => { setCreating(true) }} />

          {/* BANNER TÉCNICO INFERIOR: GARANTÍA & SOPORTE HUMANO */}
          <GuaranteeBanner />
        </>
      )}

      {creating ? <NewOrderDialog onClose={() => { setCreating(false) }} onCreated={onCreated} /> : null}
    </div>
  )
}

function ErrorState({ unavailable, onRetry }: { unavailable: boolean; onRetry: () => void }) {
  return (
    <section role="alert" className="rounded-2xl border border-[#cce7ea] bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-bold text-[#004b4e]">
        {unavailable ? 'El servicio de pedidos aún no está disponible' : 'No pudimos cargar tus pedidos.'}
      </h2>
      <p className="mt-1 text-sm font-mono text-[#557b7f]">
        {unavailable ? 'Estamos terminando esta función. Vuelve a intentarlo más tarde.' : 'Revisa tu conexión e inténtalo de nuevo.'}
      </p>
      <button
        type="button"
        className="mt-4 cursor-pointer rounded-xl border border-[#004b4e] bg-[#e8f7f9] hover:bg-[#004b4e] text-[#004b4e] hover:text-white px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </section>
  )
}
