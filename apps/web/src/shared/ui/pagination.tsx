import { useState } from 'react'

export const PAGE_SIZE = 5

const buttonClass =
  'px-2.5 py-1 rounded bg-white border border-[#cce7ea] text-[#557b7f] hover:bg-[#e8f7f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-mono font-semibold'

/** Pagina una lista en memoria. La página se acota sola si la lista se encoge (filtros, recargas). */
export function usePagination<T>(items: readonly T[], pageSize = PAGE_SIZE) {
  const [requested, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(requested, totalPages)
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return { pageItems, page, totalPages, total: items.length, start, end: start + pageItems.length, setPage }
}

interface PaginationProps {
  label: string
  page: number
  totalPages: number
  total: number
  start: number
  end: number
  onPage: (page: number) => void
}

export function Pagination({ label, page, totalPages, total, start, end, onPage }: PaginationProps) {
  if (total === 0) return null
  return (
    <nav
      aria-label={`Paginación de ${label}`}
      className="px-4 py-3 bg-[#f7fcfc] border-t border-[#cce7ea] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#557b7f]"
    >
      <div className="flex items-center gap-2">
        <span className="tabular-nums">{`Mostrando ${String(start + 1)}–${String(end)} de ${String(total)}`}</span>
        <span>·</span>
        <span className="uppercase text-[11px]">PÁGINA {page} DE {totalPages}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          className={buttonClass}
          disabled={page === 1}
          onClick={() => { onPage(page - 1) }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">chevron_left</span>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-current={n === page ? 'page' : undefined}
            aria-label={`Página ${String(n)}`}
            className={`min-w-8 px-2.5 py-1 rounded text-xs font-bold font-mono tabular-nums transition-colors cursor-pointer ${
              n === page
                ? 'bg-[#004b4e] text-white border border-[#004b4e]'
                : 'bg-white hover:bg-[#e8f7f9] border border-[#cce7ea] text-[#004b4e]'
            }`}
            onClick={() => { onPage(n) }}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          aria-label="Siguiente página"
          className={buttonClass}
          disabled={page === totalPages}
          onClick={() => { onPage(page + 1) }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>
    </nav>
  )
}
