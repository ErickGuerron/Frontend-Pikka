import { useState } from 'react'
import { userMessage } from '@/shared/api/errors'
import { ProductForm } from './ProductForm'
import { useProducts, useSetProductActive } from './hooks'
import { StockPanel } from './StockPanel'
import type { Product } from './types'

/** Administración de productos para ADMIN y OPERATOR: incluye inactivos y gestiona stock. */
export function ProductAdminPage() {
  const products = useProducts(true)
  const setActive = useSetProductActive()
  const [creating, setCreating] = useState(false)
  const [stockOf, setStockOf] = useState<Product | null>(null)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 py-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Productos</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Catálogo, precios y stock. Los inactivos no se ofrecen a los clientes.</p>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          onClick={() => { setCreating((open) => !open) }}
        >
          Nuevo producto
        </button>
      </header>

      {creating ? <ProductForm onDone={() => { setCreating(false) }} /> : null}

      {setActive.isError ? (
        <p role="alert" className="text-sm text-error">{userMessage(setActive.error)}</p>
      ) : null}

      {products.isPending ? (
        <p role="status" className="text-sm text-on-surface-variant">Cargando productos…</p>
      ) : products.isError ? (
        <section role="alert" className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-8 text-center">
          <h2 className="text-lg font-bold text-on-surface">No pudimos cargar los productos.</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{userMessage(products.error)}</p>
          <button
            type="button"
            className="mt-4 cursor-pointer rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary"
            onClick={() => void products.refetch()}
          >
            Reintentar
          </button>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest">
          <table aria-label="Productos" className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Precio</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Stock</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((product) => (
                <tr key={product.id} className="border-t border-surface-container-high/60">
                  <td className="px-4 py-3 font-semibold text-on-surface">{product.name}</td>
                  <td className="px-4 py-3">${product.unitPrice}</td>
                  <td className="px-4 py-3">{product.active ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-4 py-3">
                    {product.stockQuantity === undefined ? 'Sin control de stock' : product.stockQuantity}
                  </td>
                  <td className="flex flex-wrap justify-end gap-2 px-4 py-3">
                    {product.stockQuantity === undefined ? null : (
                      <button
                        type="button"
                        aria-label={`Ajustar stock de ${product.name}`}
                        className="cursor-pointer rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
                        onClick={() => { setStockOf(product) }}
                      >
                        Ajustar stock
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`${product.active ? 'Desactivar' : 'Activar'} ${product.name}`}
                      disabled={setActive.isPending}
                      className="cursor-pointer rounded-lg border border-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface disabled:opacity-50"
                      onClick={() => { setActive.mutate({ id: product.id, active: !product.active }) }}
                    >
                      {product.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.data.length === 0 ? <p className="p-6 text-center text-sm text-on-surface-variant">Aún no hay productos.</p> : null}
        </div>
      )}

      {stockOf !== null ? <StockPanel key={stockOf.id} product={stockOf} onClose={() => { setStockOf(null) }} /> : null}
    </div>
  )
}
