import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { canAccess } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/hooks'
import { userMessage } from '@/shared/api/errors'
import { KpiGrid } from '@/shared/ui/kpi'
import { NoDriversIllustration } from '@/shared/ui/NoDriversIllustration'
import { Pagination, usePagination } from '@/shared/ui/pagination'
import { isDriversDemoMode, listDrivers } from './api'
import { driverStatusLabels, driverStatuses, filterDrivers, vehicleTypeLabels, type DriverStatus } from './types'

/** Repartidores, su estado y si están activos (Sprint 2). Solo lectura. */
export function DriversPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<DriverStatus | 'ALL'>('ALL')
  const { data: currentUser } = useCurrentUser()

  const { data: drivers = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['drivers'],
    queryFn: listDrivers,
  })
  const visible = useMemo(() => filterDrivers(drivers, query, status), [drivers, query, status])
  const pager = usePagination(visible)

  return (
    <div className="flex flex-col gap-4 max-w-7xl">
      {/* Dossier Header */}
      <div className="bg-white rounded-xl border border-[#cce7ea] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
              <span className="font-semibold">DOSSIER FLOTA · LOGÍSTICA DE ÚLTIMA MILLA</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#004b4e] font-sans tracking-tight">
                Repartidores
              </h1>
              {isDriversDemoMode() ? (
                <span className="uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[9px]">
                  Demo · datos simulados
                </span>
              ) : null}
            </div>
            <p className="text-xs font-mono text-[#557b7f]">
              Disponibilidad, estado en ruta y control operativo de la flota activa.
            </p>
          </div>
          {canAccess(currentUser?.role, 'newDriver') ? (
            <Link
              className="self-start px-4 py-2 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-[#004b4e] shadow-sm"
              to="/drivers/new"
            >
              Nuevo repartidor
            </Link>
          ) : null}
        </div>
      </div>

      <KpiGrid
        items={[
          { label: 'Total', badge: 'GLOBAL', value: drivers.length, unit: 'repartidores', tag: 'Flota' },
          { label: 'Disponibles', badge: 'LIBRES', value: drivers.filter((d) => d.status === 'AVAILABLE').length, unit: 'sin ruta', tag: 'Listos' },
          { label: 'En ruta', badge: 'TRÁNSITO', value: drivers.filter((d) => d.status === 'ON_ROUTE').length, unit: 'en reparto', tag: 'Operando' },
          { label: 'Inactivos', badge: 'BAJA', value: drivers.filter((d) => !d.active).length, unit: 'desactivados', tag: 'Fuera de flota' },
        ]}
      />

      {/* Technical Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#cce7ea] p-4 shadow-sm flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
          <span>Buscar</span>
          <input
            className="px-3 py-1.5 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            onChange={(event) => { setQuery(event.target.value); }}
            placeholder="Nombre, teléfono, ciudad o placa"
            type="search"
            value={query}
          />
        </label>
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#557b7f] font-semibold">
          <span>Estado</span>
          <select
            className="px-3 py-1.5 rounded-lg border border-[#cce7ea] text-xs font-sans text-[#061f23] bg-white focus:outline-none focus:border-[#004b4e] focus:ring-1 focus:ring-[#004b4e] transition-all"
            onChange={(event) => { setStatus(event.target.value as DriverStatus | 'ALL'); }}
            value={status}
          >
            <option value="ALL">Todos</option>
            {driverStatuses.map((value) => (
              <option key={value} value={value}>{driverStatusLabels[value]}</option>
            ))}
          </select>
        </label>
        <div className="ml-auto text-xs font-mono text-[#557b7f]">
          TOTAL: <span className="font-bold text-[#004b4e]">{visible.length}</span> REPARTIDORES
        </div>
      </div>

      {/* Fleet Table */}
      <section className="bg-white rounded-xl border border-[#cce7ea] shadow-sm overflow-hidden">
        {isLoading ? (
          <p role="status" className="px-4 py-12 text-center font-mono text-xs text-[#557b7f]">
            Cargando repartidores…
          </p>
        ) : isError ? (
          <div role="alert" className="px-4 py-8 flex flex-col items-center gap-3 text-center">
            <p className="font-mono text-xs text-[#ba1a1a]">
              No pudimos cargar los repartidores. {userMessage(error)}
            </p>
            <button
              className="px-4 py-2 rounded-lg bg-[#004b4e] hover:bg-[#0a6568] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors border border-[#004b4e]"
              disabled={isFetching}
              onClick={() => { void refetch(); }}
              type="button"
            >
              {isFetching ? 'Reintentando…' : 'Reintentar'}
            </button>
          </div>
        ) : drivers.length === 0 ? (
          <div className="px-6 py-20 md:py-28 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-32 h-32 rounded-3xl bg-[#edf7f6] border border-[#bce4df] flex items-center justify-center mb-6 shadow-sm">
              <NoDriversIllustration />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#08292d] mb-2">No hay repartidores registrados</h2>
            <p className="text-sm text-[#587679] max-w-md">Usa el botón superior para dar de alta repartidores y gestionar la flota activa.</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="px-4 py-12 text-center font-mono text-xs text-[#557b7f]">
            Ningún repartidor coincide con el filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Repartidores con su teléfono, ciudad, vehículo, placa, estado y si están activos</caption>
              <thead className="bg-[#f0fafb] text-[#557b7f] font-mono uppercase tracking-wider text-[10px] border-b border-[#cce7ea]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Nombre</th>
                  <th scope="col" className="px-4 py-3 font-bold">Teléfono</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ciudad</th>
                  <th scope="col" className="px-4 py-3 font-bold">Vehículo</th>
                  <th scope="col" className="px-4 py-3 font-bold">Placa</th>
                  <th scope="col" className="px-4 py-3 font-bold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-bold">Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cce7ea]">
                {pager.pageItems.map((driver) => {
                  const statusColor =
                    driver.status === 'AVAILABLE'
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : driver.status === 'ON_ROUTE'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'

                  return (
                    <tr key={driver.id} className="hover:bg-[#f7fcfc] transition-colors">
                      <td className="px-4 py-3 text-[#061f23] font-semibold flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="h-7 w-7 rounded-full bg-[#e8f7f9] text-[#004b4e] font-bold font-mono text-[11px] flex items-center justify-center border border-[#cce7ea]"
                        >
                          {driver.fullName.charAt(0).toUpperCase()}
                        </span>
                        <span>{driver.fullName}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#557b7f]">{driver.phone}</td>
                      <td className="px-4 py-3 text-[#061f23]">{driver.city}</td>
                      <td className="px-4 py-3 text-[#061f23]">{vehicleTypeLabels[driver.vehicleType]}</td>
                      <td className="px-4 py-3 font-mono text-[#061f23]">{driver.plate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border ${statusColor}`}>
                          {driverStatusLabels[driver.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {driver.active ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#006b5f] bg-[#e8f7f9] px-2 py-0.5 rounded border border-[#cce7ea]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#006b5f]" />
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#ba1a1a] bg-[#ffdad6]/40 px-2 py-0.5 rounded border border-[#ffdad6]">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination label="repartidores" {...pager} onPage={pager.setPage} />
          </div>
        )}
      </section>
    </div>
  )
}
