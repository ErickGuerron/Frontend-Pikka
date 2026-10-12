import { useEffect, useRef } from 'react'
import type { Coordinate } from '@/features/geo/types'

export interface VertexListModalProps {
  /** Nombre del anillo: "Exterior" o "Hueco". */
  title: string
  vertices: readonly Coordinate[]
  onRemove: (index: number) => void
  onClose: () => void
}

/**
 * Listado completo de los vértices de un anillo. Sirve para revisar coordenadas exactas y el orden antes de guardar,
 * sin ocupar el panel de edición. Escape o el botón cierran el modal.
 */
export function VertexListModal({ title, vertices, onRemove, onClose }: VertexListModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vertex-modal-title"
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl ring-1 ring-black/5"
      >
        {/* Encabezado turquesa con icono del trazo */}
        <header className="flex items-center gap-3 bg-gradient-to-r from-pikka-teal to-pikka-cyan px-5 py-4 text-white">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner"
          >
            <span className="material-symbols-outlined text-[22px]">polyline</span>
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="vertex-modal-title" className="text-[14px] font-bold leading-tight">
              Vértices del {title.toLowerCase()}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/80">
              {String(vertices.length)} {vertices.length === 1 ? 'punto que define' : 'puntos que definen'} el contorno, en el orden en que se trazaron
            </p>
          </div>
          <button
            ref={closeRef}
            aria-label="Cerrar listado de vértices"
            className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/20 cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Tabla con filas separadas y encabezado fijo */}
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-surface-container-lowest px-4 py-3">
          <table className="w-full border-separate border-spacing-y-1.5 text-left text-[12px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-pikka-teal">
                <th scope="col" className="px-4 pb-1">Vértice</th>
                <th scope="col" className="px-4 pb-1">Latitud</th>
                <th scope="col" className="px-4 pb-1">Longitud</th>
                <th scope="col" className="px-4 pb-1 text-right"><span className="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {vertices.map((vertex, i) => {
                const label = `V-${String(i + 1).padStart(2, '0')}`
                return (
                  <tr key={`${label}-${String(i)}`} className="group">
                    <td className="rounded-l-xl border-y border-l border-pikka-mint bg-surface-container-low px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-on-surface">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-pikka-cyan ring-2 ring-pikka-mint" />
                        {label}
                      </span>
                    </td>
                    <td className="border-y border-pikka-mint bg-surface-container-low px-4 py-3 font-mono text-on-surface-variant">
                      {vertex.latitude.toFixed(6)}
                    </td>
                    <td className="border-y border-pikka-mint bg-surface-container-low px-4 py-3 font-mono text-on-surface-variant">
                      {vertex.longitude.toFixed(6)}
                    </td>
                    <td className="rounded-r-xl border-y border-r border-pikka-mint bg-surface-container-low px-4 py-3 text-right">
                      <button
                        aria-label={`Quitar vértice ${label} del listado`}
                        className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-red-50 hover:text-error cursor-pointer"
                        onClick={() => { onRemove(i); }}
                        type="button"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pie turquesa */}
        <footer className="flex items-center justify-between gap-3 bg-gradient-to-r from-pikka-teal to-pikka-cyan px-5 py-3 text-[11px] text-white">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">info</span>
            Los cambios se guardan al pulsar “Guardar” en el editor.
          </span>
          <button
            className="rounded-lg bg-white px-3.5 py-1.5 text-[11px] font-bold text-pikka-teal shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
            onClick={onClose}
            type="button"
          >
            Listo
          </button>
        </footer>
      </div>
    </div>
  )
}
