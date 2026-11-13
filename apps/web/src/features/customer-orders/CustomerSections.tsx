import { Link } from 'react-router'
import { useProducts } from '@/features/catalog/hooks'

export function CustomerCatalogSection({ onOrder }: { onOrder: (productId: string) => void }) {
  const { data } = useProducts(false)
  const products = (data ?? []).filter((product) => product.active && product.stockQuantity !== 0).slice(0, 3)
  if (products.length === 0) return null

  return (
    <section aria-labelledby="customer-catalog-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="customer-catalog-title" className="text-xl font-bold text-on-surface">Productos disponibles</h2>
        <Link to="/catalogo" className="text-sm font-semibold text-primary hover:underline">Ver catálogo</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="flex flex-col gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" className="h-36 w-full rounded-xl object-cover" /> : null}
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-on-surface">{product.name}</h3>
              <span className="text-sm font-semibold text-primary">${product.unitPrice}</span>
            </div>
            {product.description ? <p className="text-sm text-on-surface-variant">{product.description}</p> : null}
            <button type="button" onClick={() => { onOrder(product.id) }} className="mt-auto rounded-xl bg-surface-container px-3 py-2 text-sm font-semibold text-primary">
              Pedir {product.name}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
