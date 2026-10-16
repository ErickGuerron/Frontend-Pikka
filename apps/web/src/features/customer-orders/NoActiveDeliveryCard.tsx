import pikkaNutria from '@/assets/pikka.png'

interface NoActiveDeliveryCardProps {
  onNewOrder: () => void
  onViewHistory: () => void
  hasAnyOrders?: boolean
}

export function NoActiveDeliveryCard({ onNewOrder, onViewHistory, hasAnyOrders = true }: NoActiveDeliveryCardProps) {
  return (
    <section
      aria-label="Estado de entregas activas"
      className="relative overflow-hidden rounded-2xl border border-dashed border-[#cce7ea] bg-white p-6 sm:p-8 text-center shadow-sm"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#e8f7f9] blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-[#f0fafb] blur-3xl opacity-70" />

      <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto space-y-4">
        {/* Nutria mascot / badge */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#cce7ea] bg-[#f7fcfc] p-2 shadow-sm">
          <img
            src={pikkaNutria}
            alt="Pikka Nutria"
            className="h-full w-full object-contain"
          />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#006b5f]" />
          </span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#cce7ea] bg-[#e8f7f9] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#004b4e]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
          <span>ESTADO DE ENTREGAS · TELEMETRÍA EN ESPERA</span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#004b4e] font-sans">
            No hay pedidos tuyos que estén siendo entregados en este momento
          </h2>
          <p className="text-xs sm:text-sm text-[#557b7f] leading-relaxed">
            Cuando tengas un despacho activo en ruta, aquí podrás consultar el radar en tiempo real, la temperatura de cabina y tu código PIN de entrega.
          </p>
        </div>

        {/* Action buttons requested by user */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNewOrder}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#004b4e] hover:bg-[#0a6568] text-white px-5 py-2.5 font-sans font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] border border-[#004b4e]"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">add_circle</span>
            <span>Realiza un nuevo pedido</span>
          </button>
          <button
            type="button"
            onClick={onViewHistory}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#cce7ea] bg-[#e8f7f9] hover:bg-[#d9f2f9] text-[#004b4e] px-5 py-2.5 font-sans font-semibold text-xs sm:text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-[#006b5f]" aria-hidden="true">history</span>
            <span>Historial de pedidos</span>
          </button>
        </div>

        {!hasAnyOrders ? (
          <p className="text-xs font-mono text-[#557b7f] pt-1">Aún no tienes pedidos</p>
        ) : null}
      </div>
    </section>
  )
}
