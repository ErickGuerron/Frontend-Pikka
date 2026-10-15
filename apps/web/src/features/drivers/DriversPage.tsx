import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { userMessage } from '@/shared/api/errors'
import { isDriversDemoMode, listDrivers } from './api'
import { driverStatusLabels, driverStatuses, filterDrivers, type DriverStatus } from './types'

/** Repartidores, su estado y si están activos (Sprint 2). Solo lectura. */
export function DriversPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<DriverStatus | 'ALL'>('ALL')

  const { data: drivers = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['drivers'],
    queryFn: listDrivers,
  })
  const visible = useMemo(() => filterDrivers(drivers, query, status), [drivers, query, status])

  return (
    <div className="flex flex-col gap-2 pt-2 pb-6">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-on-surface tracking-tight">Repartidores</h1>
          {isDriversDemoMode() ? (
            <span className="uppercase tracking-wider bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold text-[9px]">
              Demo · datos simulados
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-on-surface-variant leading-tight">Disponibilidad de los repartidores de hoy.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col gap-0.5 text-[10px] text-on-surface-variant">
          Buscar
          <input
            className="px-2 py-1.5 rounded-lg border border-outline-variant text-[11px] text-on-surface bg-surface-container-lowest"
            onChange={(event) => { setQuery(event.target.value); }}
            placeholder="Nombre o teléfono"
            type="search"
            value={query}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-[10px] text-on-surface-variant">
          Estado
          <select
            className="px-2 py-1.5 rounded-lg border border-outline-variant text-[11px] text-on-surface bg-surface-container-lowest"
            onChange={(event) => { setStatus(event.target.value as DriverStatus | 'ALL'); }}
            value={status}
          >
            <option value="ALL">Todos</option>
            {driverStatuses.map((value) => (
              <option key={value} value={value}>{driverStatusLabels[value]}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 overflow-hidden">
        {isLoading ? (
          <p role="status" className="px-4 py-8 text-center text-[11px] text-on-surface-variant">Cargando repartidores…</p>
        ) : isError ? (
          <div role="alert" className="px-4 py-6 flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] text-error">No pudimos cargar los repartidores. {userMessage(error)}</p>
            <button
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold cursor-pointer disabled:opacity-50"
              disabled={isFetching}
              onClick={() => { void refetch(); }}
              type="button"
            >
              {isFetching ? 'Reintentando…' : 'Reintentar'}
            </button>
          </div>
        ) : drivers.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-on-surface">No hay repartidores registrados.</p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-on-surface">Ningún repartidor coincide con el filtro.</p>
        ) : (
          <table className="w-full text-left text-[11px]">
            <caption className="sr-only">Repartidores con su teléfono, estado y si están activos</caption>
            <thead className="bg-surface-container-low/60 text-on-surface-variant uppercase tracking-wider text-[9px]">
              <tr>
                <th scope="col" className="px-4 py-2 font-bold">Nombre</th>
                <th scope="col" className="px-4 py-2 font-bold">Teléfono</th>
                <th scope="col" className="px-4 py-2 font-bold">Estado</th>
                <th scope="col" className="px-4 py-2 font-bold">Activo</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((driver) => (
                <tr key={driver.id} className="border-t border-surface-container">
                  <td className="px-4 py-2 text-on-surface font-semibold">{driver.fullName}</td>
                  <td className="px-4 py-2 text-on-surface">{driver.phone}</td>
                  <td className="px-4 py-2 text-on-surface">{driverStatusLabels[driver.status]}</td>
                  <td className="px-4 py-2 text-on-surface">{driver.active ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
