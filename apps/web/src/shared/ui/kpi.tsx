export interface KpiItem {
  label: string
  /** Etiqueta corta junto al título, p. ej. "GLOBAL". */
  badge: string
  value: number
  unit: string
  /** Etiqueta inferior con punto de color, p. ej. "Directorio". */
  tag: string
}

const columns: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

/** Fila de indicadores común a todas las pantallas de gestión. */
export function KpiGrid({ items }: { items: readonly KpiItem[] }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${columns[items.length] ?? 'lg:grid-cols-4'}`}>
      {items.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded border border-[#cce7ea] p-4 flex flex-col justify-between shadow-sm hover:border-[#004b4e] transition-all min-w-0"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#cce7ea]">
            <span className="text-[10px] font-mono text-[#557b7f] uppercase tracking-wider font-semibold truncate">{kpi.label}</span>
            <span className="text-[9px] font-mono text-[#004b4e] bg-[#e8f7f9] px-1.5 py-0.5 rounded border border-[#cce7ea] font-bold">
              {kpi.badge}
            </span>
          </div>
          <div className="pt-3 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#004b4e] tabular-nums">{kpi.value}</span>
              <span className="text-xs font-mono text-[#557b7f] ml-1">{kpi.unit}</span>
            </div>
            <span className="text-[10px] font-mono text-[#006b5f] bg-[#e8f7f9] px-2 py-0.5 rounded border border-[#cce7ea] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
              {kpi.tag}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
