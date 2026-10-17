import { useState } from 'react'
import { Link } from 'react-router'
import { useProducts } from './hooks'
import { userMessage } from '@/shared/api/errors'
import { placeholderColor } from '@/shared/ui/product-color'
import { NewOrderDialog } from '@/features/customer-orders/NewOrderDialog'

/**
 * Catálogo para el cliente: solo productos activos. El stock no se muestra al cliente.
 * Estandarizado con el diseño editorial y carrusel externo de Pikka.
 */
export function CatalogPage() {
  const products = useProducts(false)
  const [query, setQuery] = useState('')
  const [orderingProductId, setOrderingProductId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const normalizedQuery = query.toLowerCase().trim()
  const allProducts = products.data ?? []
  const visibleProducts = normalizedQuery === ''
    ? allProducts
    : allProducts.filter((product) =>
        product.name.toLowerCase().includes(normalizedQuery) ||
        (product.description?.toLowerCase().includes(normalizedQuery) ?? false),
      )

  return (
    <div className="mx-auto flex flex-col gap-6 max-w-6xl w-full pb-16">
      {/* Cabecera centrada y estilizada con diseño editorial */}
      <header className="rounded-2xl border border-[#cce7ea] bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cce7ea] bg-[#e8f7f9] px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
            <span className="font-semibold">SELECCIÓN CURADA · COMERCIO RÁPIDO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#004b4e] font-sans tracking-tight">
            Catálogo
          </h1>
          <p className="text-xs sm:text-sm font-sans text-[#557b7f]">
            Productos frescos y esenciales disponibles para despacho inmediato con empaque isotérmico inteligente.
          </p>
        </div>

        {/* Buscador y contador rápido de catálogo */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#cce7ea]/50">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#557b7f]" aria-hidden="true">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value) }}
              placeholder="Buscar productos por nombre…"
              aria-label="Buscar productos"
              className="w-full rounded-xl border border-[#cce7ea] bg-[#f7fcfc] pl-9 pr-8 py-2 font-sans text-xs text-[#061f23] placeholder-[#557b7f]/70 outline-none transition-colors focus:border-[#004b4e] focus:bg-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => { setQuery('') }}
                aria-label="Limpiar búsqueda"
                className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#557b7f] hover:text-[#061f23]"
              >
                ✕
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-[#557b7f]">
            <span className="material-symbols-outlined text-[16px] text-[#14b8a6]" aria-hidden="true">
              inventory_2
            </span>
            <span>{visibleProducts.length} {visibleProducts.length === 1 ? 'producto disponible' : 'productos disponibles'}</span>
          </div>
        </div>
      </header>

      {/* Notificación de pedido creado */}
      {notice !== null ? (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-[#cce7ea] bg-[#e8f7f9] px-4 py-3 text-sm text-[#004b4e] font-medium shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#14b8a6]" aria-hidden="true">
              check_circle
            </span>
            <span>{notice}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/mis-pedidos" className="font-mono text-xs font-bold underline hover:text-[#0a6568]">
              Ver en Mis Pedidos →
            </Link>
            <button
              type="button"
              aria-label="Cerrar aviso"
              className="cursor-pointer text-base font-bold leading-none hover:text-[#ba1a1a]"
              onClick={() => { setNotice(null) }}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      {/* Estados de carga, error y lista */}
      {products.isPending ? (
        <div role="status" className="rounded-2xl border border-[#cce7ea] bg-white p-12 text-center font-mono text-xs text-[#557b7f] shadow-sm">
          Cargando productos…
        </div>
      ) : products.isError ? (
        <section role="alert" className="rounded-2xl border border-[#ffb4ab] bg-[#ffdad6]/30 p-8 text-center font-mono">
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
      ) : allProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cce7ea] bg-white p-12 text-center font-mono text-xs text-[#557b7f]">
          No hay productos disponibles por ahora.
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#cce7ea] bg-white p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-[#557b7f]" aria-hidden="true">
            search_off
          </span>
          <p className="font-mono text-xs text-[#557b7f]">
            Ningún producto coincide con “{query}”.
          </p>
          <button
            type="button"
            onClick={() => { setQuery('') }}
            className="mt-1 cursor-pointer rounded-full border border-[#004b4e] bg-[#e8f7f9] hover:bg-[#004b4e] hover:text-white text-[#004b4e] px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Quitar filtro
          </button>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <li
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#cce7ea] bg-white shadow-xs hover:shadow-md hover:border-[#004b4e]/40 transition-all duration-200"
            >
              {/* Imagen o Placeholder idéntico al carrusel externo */}
              {product.imageUrl ? (
                <div className="relative h-48 w-full overflow-hidden border-b border-[#cce7ea] bg-[#f7fcfc]">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  style={{ backgroundColor: placeholderColor(product.id) }}
                  className="flex h-48 w-full items-center justify-center border-b border-[#cce7ea]"
                >
                  <span className="text-5xl font-bold text-[#004b4e]/70">
                    {product.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Cuerpo de la tarjeta */}
              <div className="flex flex-1 flex-col p-5">
                <div className="space-y-1.5">
                  <h2 className="break-words text-base font-bold tracking-tight text-[#061f23] font-sans">
                    {product.name}
                  </h2>
                  {product.description ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-[#557b7f] font-sans">
                      {product.description}
                    </p>
                  ) : null}
                </div>

                {/* Pie de la tarjeta con precio y botón Realizar pedido */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-5 border-t border-[#cce7ea]/50">
                  <div>
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[#557b7f]">
                      Precio
                    </span>
                    <p className="font-mono text-lg font-bold tabular-nums text-[#004b4e]">
                      ${product.unitPrice}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOrderingProductId(product.id) }}
                    aria-label={`Realizar pedido de ${product.name}`}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-[#004b4e] bg-[#004b4e] hover:bg-[#0a6568] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white shadow-xs transition-all active:scale-95 hover:shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      shopping_cart_checkout
                    </span>
                    <span>Realizar pedido</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de nuevo pedido con producto auto-seleccionado */}
      {orderingProductId !== null ? (
        <NewOrderDialog
          initialProductId={orderingProductId}
          onClose={() => { setOrderingProductId(null) }}
          onCreated={(order) => {
            setOrderingProductId(null)
            setNotice(`¡Pedido #${order.id.slice(0, 8)} realizado con éxito!`)
          }}
        />
      ) : null}
    </div>
  )
}
