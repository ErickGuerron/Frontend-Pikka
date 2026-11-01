import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks'
import { fetchReadiness } from '@/shared/api/system'

export function HomePage() {
  const { data: user } = useCurrentUser()
  const readiness = useQuery({
    queryKey: ['system', 'ready'],
    queryFn: ({ signal }) => fetchReadiness(signal),
    refetchInterval: 30_000,
    retry: false,
  })

  return (
    <div className="flex flex-col gap-5 pt-2 pb-16 font-sans">
      {/* Dossier Header */}
      <div className="bg-white rounded border border-[#cce7ea] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#e8f7f9] border border-[#cce7ea] text-[10px] font-mono tracking-widest uppercase text-[#004b4e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
            <span>Consola Central · Centro de Operaciones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#004b4e] flex items-center gap-3">
            Hola{user ? `, ${user.fullName}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-[#557b7f] font-normal leading-relaxed max-w-2xl">
            Desde aquí vas a registrar pedidos, administrar zonas, armar rutas y seguir las entregas de la flota en tiempo real.
          </p>
        </div>
      </div>

      {/* Telemetría y Estado del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white rounded border border-[#cce7ea] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#cce7ea]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#557b7f]">
              TELEMETRÍA DE SERVICIO
            </span>
            <span className="text-[9px] font-mono text-[#004b4e] bg-[#e8f7f9] px-2 py-0.5 rounded border border-[#cce7ea] font-bold">
              API GATEWAY
            </span>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#004b4e] font-sans">Estado del sistema</h2>
              <p className="text-xs text-[#557b7f] font-sans mt-0.5">Disponibilidad del backend y microservicios logísticos.</p>
            </div>
            <div data-testid="system-status" className="font-mono text-xs">
              {readiness.isPending && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f0fafb] text-[#557b7f] border border-[#cce7ea]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8ba7ab] animate-pulse" />
                  Comprobando…
                </span>
              )}
              {readiness.isSuccess && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e8f7f9] text-[#006b5f] border border-[#cce7ea] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] animate-pulse" />
                  Backend disponible
                </span>
              )}
              {readiness.isError && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ffdad6]/60 text-[#ba1a1a] border border-[#ffdad6] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                  Backend no disponible
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded border border-[#cce7ea] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#cce7ea]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#557b7f]">
              RED DE DESPACHO
            </span>
            <span className="text-[9px] font-mono text-[#006b5f] bg-[#e8f7f9] px-2 py-0.5 rounded border border-[#cce7ea] font-bold">
              OPERATIVO
            </span>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#004b4e] font-sans">Canales de distribución</h2>
              <p className="text-xs text-[#557b7f] font-sans mt-0.5">Monitoreo continuo de pedidos, excepciones y rutas.</p>
            </div>
            <span className="text-xs font-mono text-[#004b4e] font-bold bg-[#f7fcfc] px-3 py-1 rounded border border-[#cce7ea]">
              v2.4
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
