export interface ZoneTab<T extends string> {
  id: T
  label: string
  /** Contador opcional, por ejemplo zonas registradas. */
  badge?: number | null
  /** Punto que avisa de algo pendiente en esa pestaña, por ejemplo una zona en edición. */
  dot?: boolean
}

export interface ZoneTabsProps<T extends string> {
  label: string
  tabs: ZoneTab<T>[]
  active: T
  onChange: (id: T) => void
}

/** Pestañas del panel lateral de zonas. Mantienen fuera del formulario lo que no se está editando. */
export function ZoneTabs<T extends string>({ label, tabs, active, onChange }: ZoneTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="sticky top-0 z-10 flex gap-1 border-b border-surface-container-high bg-surface-container-lowest px-3 pt-2"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            aria-selected={selected}
            className={`-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-2.5 pb-2 text-[12px] font-semibold transition-colors ${
              selected ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => { onChange(tab.id); }}
            role="tab"
            type="button"
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span className="rounded-full bg-surface-container-high px-1.5 text-[10px] font-bold text-on-surface">{tab.badge}</span>
            )}
            {tab.dot === true && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />}
          </button>
        )
      })}
    </div>
  )
}
