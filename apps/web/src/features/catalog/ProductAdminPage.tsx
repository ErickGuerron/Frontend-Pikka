import { useState } from 'react'
import { userMessage } from '@/shared/api/errors'
import { ProductFormModal } from './ProductFormModal'
import { useProducts, useSetProductActive } from './hooks'
import { StockPanel } from './StockPanel'
import type { Product } from './types'

/** Administración de productos para ADMIN y OPERATOR: incluye inactivos y gestiona stock. */
export function ProductAdminPage() {
  const products = useProducts(true)
  const setActive = useSetProductActive()
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [stockOf, setStockOf] = useState<Product | null>(null)

  return (
    <div className="flex flex-col gap-4 max-w-7xl">
      {/* Dossier Header */}
      <div className="bg-white rounded-xl border border-[#cce7ea] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
              <span className="font-semibold">DOSSIER INVENTARIO · CATÁLOGO Y ALMACÉN</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#004b4e] font-sans tracking-tight">
              Productos
            </h1>
            <p className="text-xs font-mono text-[#557b7f]">
              Catálogo, precios y stock. Los inactivos no se ofrecen a los clientes.
            </p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-[#004b4e] hover:bg-[#0a6568] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm border border-[#004b4e] transition-colors flex items-center gap-2 self-start sm:self-auto"
            onClick={() => {
              setNotice(null)
              setCreating(true)
            }}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              add_circle
            </span>
            <span>Nuevo producto</span>
          </button>
        </div>
      </div>

      {creating ? (
        <ProductFormModal
          onClose={() => { setCreating(false) }}
          onCreated={(name) => {
            setCreating(false)
            setNotice(`Producto «${name}» creado.`)
          }}
        />
      ) : null}

      {notice === null ? null : (
        <div role="status" className="p-3 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-mono text-xs font-semibold">
          {notice}
        </div>
      )}

      {setActive.isError ? (
        <div role="alert" className="p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] font-mono text-xs">
          {userMessage(setActive.error)}
        </div>
      ) : null}

      {products.isPending ? (
        <div role="status" className="bg-white rounded-xl border border-[#cce7ea] p-12 text-center font-mono text-xs text-[#557b7f]">
          Cargando productos…
        </div>
      ) : products.isError ? (
        <section role="alert" className="rounded-xl border border-[#ffb4ab] bg-[#ffdad6]/30 p-8 text-center font-mono">
          <h2 className="text-sm font-bold text-[#ba1a1a]">No pudimos cargar los productos.</h2>
          <p className="mt-1 text-xs text-[#ba1a1a]">{userMessage(products.error)}</p>
          <button
            type="button"
            className="mt-4 cursor-pointer rounded-lg bg-[#ba1a1a] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border border-[#ba1a1a]"
            onClick={() => void products.refetch()}
          >
            Reintentar
          </button>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cce7ea] bg-white shadow-sm">
          <table aria-label="Productos" className="w-full text-left text-xs">
            <thead className="bg-[#f0fafb] text-[#557b7f] font-mono uppercase tracking-wider text-[10px] border-b border-[#cce7ea]">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Nombre</th>
                <th scope="col" className="px-4 py-3 font-bold">Precio</th>
                <th scope="col" className="px-4 py-3 font-bold">Estado</th>
                <th scope="col" className="px-4 py-3 font-bold">Stock</th>
                <th scope="col" className="px-4 py-3 font-bold text-right"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cce7ea]">
              {products.data.map((product) => (
                <tr key={product.id} className="hover:bg-[#f7fcfc] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#061f23]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#004b4e]" aria-hidden="true">
                        inventory_2
                      </span>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[#004b4e]">${product.unitPrice}</td>
                  <td className="px-4 py-3">
                    {product.active ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#006b5f] bg-[#e8f7f9] px-2 py-0.5 rounded border border-[#cce7ea]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#006b5f]" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#557b7f] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {product.stockQuantity === undefined ? (
                      <span className="text-[#557b7f] text-[11px]">Sin control de stock</span>
                    ) : (
                      <span className="font-bold text-[#061f23] bg-[#f0fafb] border border-[#cce7ea] px-2 py-0.5 rounded text-[11px]">
                        {product.stockQuantity}
                      </span>
                    )}
                  </td>
                  <td className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
                    {product.stockQuantity === undefined ? null : (
                      <button
                        type="button"
                        aria-label={`Ajustar stock de ${product.name}`}
                        className="cursor-pointer rounded-lg border border-[#004b4e] bg-white hover:bg-[#e8f7f9] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#004b4e] transition-colors"
                        onClick={() => { setStockOf(product) }}
                      >
                        Ajustar stock
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`${product.active ? 'Desactivar' : 'Activar'} ${product.name}`}
                      disabled={setActive.isPending}
                      className="cursor-pointer rounded-lg border border-[#cce7ea] bg-white hover:bg-[#f0fafb] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#557b7f] disabled:opacity-50 transition-colors"
                      onClick={() => { setActive.mutate({ id: product.id, active: !product.active }) }}
                    >
                      {product.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.data.length === 0 ? (
            <p className="p-8 text-center font-mono text-xs text-[#557b7f]">Aún no hay productos.</p>
          ) : null}
        </div>
      )}

      {stockOf !== null ? <StockPanel key={stockOf.id} product={stockOf} onClose={() => { setStockOf(null) }} /> : null}
    </div>
  )
}
