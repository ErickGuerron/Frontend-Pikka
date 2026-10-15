import { useProducts } from './hooks'
import { userMessage } from '@/shared/api/errors'

/** Catálogo para el cliente: solo productos activos. El stock no se muestra al cliente. */
export function CatalogPage() {
  const products = useProducts(false)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-6">
      <header className="rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-on-surface">Catálogo</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Productos disponibles para tu próximo pedido.</p>
      </header>

      {products.isPending ? (
        <p role="status" className="text-sm text-on-surface-variant">
          Cargando productos…
        </p>
      ) : products.isError ? (
        <section role="alert" className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-8 text-center">
          <h2 className="text-lg font-bold text-on-surface">No pudimos cargar el catálogo.</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{userMessage(products.error)}</p>
          <button
            type="button"
            className="mt-4 cursor-pointer rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary"
            onClick={() => void products.refetch()}
          >
            Reintentar
          </button>
        </section>
      ) : products.data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-surface-container-high bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          No hay productos disponibles por ahora.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {products.data.map((product) => (
            <li key={product.id} className="flex flex-col gap-2 rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm">
              <h2 className="text-base font-bold text-on-surface">{product.name}</h2>
              {product.description ? <p className="text-sm text-on-surface-variant">{product.description}</p> : null}
              <p className="mt-auto text-lg font-bold text-primary">${product.unitPrice}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
