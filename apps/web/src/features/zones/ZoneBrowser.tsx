import { useMemo, useState } from 'react'
import type { Zone } from './types'

export interface ZoneBrowserProps {
  zones: Zone[]
  /** Zona resaltada en el mapa, si la hay. */
  selectedId: string | null
  onPick: (zone: Zone) => void
}

/**
 * Buscador de zonas para encontrarlas por nombre o código y resaltarlas en el mapa. No clasifica
 * direcciones: para saber si un pedido se puede atender, usa el punto elegido arriba.
 */
export function ZoneBrowser({ zones, selectedId, onPick }: ZoneBrowserProps) {
  const [filter, setFilter] = useState('')

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    const list = needle === ''
      ? zones
      : zones.filter((z) => z.name.toLowerCase().includes(needle) || z.code.toLowerCase().includes(needle))
    return [...list].sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE'))
  }, [zones, filter])

  return (
    <section aria-label="Zonas de reparto" className="flex flex-col gap-2 rounded-xl border border-surface-container-high/70 bg-surface-container-lowest p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">Buscar zona</h2>
        <span className="text-[10px] font-semibold text-on-surface-variant">{zones.length} registradas</span>
      </div>
      <label className="flex items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low px-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
        <input
          aria-label="Buscar zona por nombre o código"
          className="h-8 min-w-0 flex-1 bg-transparent text-[12px] text-on-surface placeholder:text-on-surface-variant focus:outline-none"
          onChange={(e) => { setFilter(e.target.value); }}
          placeholder="Nombre o código de zona"
          type="text"
          value={filter}
        />
      </label>

      {zones.length === 0 && <p className="text-[11px] text-on-surface-variant">Aún no hay zonas registradas.</p>}
      {zones.length > 0 && visible.length === 0 && <p className="text-[11px] text-on-surface-variant">Ninguna zona coincide.</p>}

      <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
        {visible.map((zone) => {
          const selected = zone.id === selectedId
          const active = zone.status === 'ACTIVE'
          return (
            <li key={zone.id}>
              <button
                aria-pressed={selected}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] cursor-pointer transition-colors ${
                  selected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-container-low'
                } ${active ? '' : 'opacity-70'}`}
                onClick={() => { onPick(zone); }}
                type="button"
              >
                <span className="min-w-0 truncate">
                  <span className="font-semibold text-on-surface">{zone.name}</span>
                  <span className="ml-1.5 font-mono text-on-surface-variant">{zone.code}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    active ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {active ? 'Activa' : 'Inactiva'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
