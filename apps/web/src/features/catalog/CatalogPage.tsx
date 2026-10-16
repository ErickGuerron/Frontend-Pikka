import { useProducts } from './hooks'
import { userMessage } from '@/shared/api/errors'

/** Catálogo para el cliente: solo productos activos. El stock no se muestra al cliente. */
export function CatalogPage() {
  const products = useProducts(false)

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <header className="rounded-xl border border-[#cce7ea] bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
            <span className="font-semibold">SELECCIÓN CURADA · COMERCIO RÁPIDO</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#004b4e] font-sans tracking-tight">
            Catálogo
          </h1>
          <p className="text-xs font-mono text-[#557b7f]">
            Productos disponibles para tu próximo pedido.
          </p>
        </div>
      </header>

      {products.isPending ? (
        <div role="status" className="rounded-xl border border-[#cce7ea] bg-white p-12 text-center font-mono text-xs text-[#557b7f]">
          Cargando productos…
        </div>
      ) : products.isError ? (
        <section role="alert" className="rounded-xl border border-[#ffb4ab] bg-[#ffdad6]/30 p-8 text-center font-mono">
          <h2 className="text-sm font-bold text-[#ba1a1a]">No pudimos cargar el catálogo.</h2>
          <p className="mt-1 text-xs text-[#ba1a1a]">{userMessage(products.error)}</p>
          <button
            type="button"
            className="mt-4 cursor-pointer rounded-lg bg-[#ba1a1a] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border border-[#ba1a1a]"
            onClick={() => void products.refetch()}
          >
            Reintentar
          </button>
        </section>
      ) : products.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#cce7ea] bg-white p-12 text-center font-mono text-xs text-[#557b7f]">
          No hay productos disponibles por ahora.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.map((product) => (
            <li
              key={product.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-[#cce7ea] bg-white p-5 shadow-sm hover:border-[#004b4e] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#004b4e]">
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
                    local_mall
                  </span>
                  <h2 className="text-base font-bold text-[#061f23] font-sans">{product.name}</h2>
                </div>
                {product.description ? (
                  <p className="text-xs font-sans text-[#557b7f] leading-relaxed">{product.description}</p>
                ) : null}
              </div>
              <div className="pt-3 border-t border-[#cce7ea] flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#557b7f]">Precio</span>
                <p className="text-lg font-bold text-[#004b4e] font-mono">${product.unitPrice}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
