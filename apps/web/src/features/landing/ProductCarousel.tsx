import { Link } from 'react-router'
import { ScrollCarousel } from './ScrollCarousel'
import { filterProducts, formatPrice, usePublicProducts, type PublicProduct } from './catalog'

const TITLE_ID = 'catalogo-titulo'
const SKELETON_CARDS = 3
const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

const skeletonCard = 'h-64 shrink-0 basis-full snap-start animate-pulse rounded-2xl bg-surface-container motion-reduce:animate-none md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]'

interface ProductCarouselProps {
  /** Texto del buscador de cabecera; filtra por nombre cuando el catálogo ya cargó. */
  query: string
  onClearQuery: () => void
}

/** Catálogo público de productos. Sin stock ni calificaciones: nombre, descripción, precio y pedido. */
export function ProductCarousel({ query, onClearQuery }: ProductCarouselProps) {
  const { data: products, isPending, isError, isFetching, refetch } = usePublicProducts()

  // Sin productos la sección no aporta nada: se oculta en lugar de mostrar un hueco.
  if (!isPending && !isError && products.length === 0) return null

  const visible = isPending || isError ? [] : filterProducts(products, query)

  return (
    <section id="catalogo" className="scroll-mt-20 bg-surface-container-low px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 id={TITLE_ID} className="text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
          Catálogo
        </h2>
        <p className="mt-2 text-on-surface-variant">Elige un producto y haz tu pedido con tu cuenta.</p>

        <div className="mt-10">
          {isPending ? (
            <div data-testid="products-skeleton" aria-busy="true" className="flex gap-6 overflow-hidden">
              <p className="sr-only">Cargando productos…</p>
              {Array.from({ length: SKELETON_CARDS }, (_, i) => (
                <div key={i} aria-hidden="true" className={skeletonCard} />
              ))}
            </div>
          ) : null}

          {isError ? (
            <div role="alert" className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6">
              <p className="font-semibold">No pudimos cargar los productos.</p>
              <p className="mt-1 text-sm text-on-surface-variant">Revisa tu conexión e inténtalo de nuevo.</p>
              <button
                type="button"
                disabled={isFetching}
                onClick={() => {
                  void refetch()
                }}
                className={`mt-4 rounded-xl bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!isPending && !isError && visible.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6">
              <p role="status" className="font-semibold">
                Ningún producto coincide con “{query}”.
              </p>
              <button
                type="button"
                onClick={onClearQuery}
                className={`rounded-xl bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-container ${focus}`}
              >
                Quitar filtro
              </button>
            </div>
          ) : null}

          {visible.length > 0 ? <ProductSlides products={visible} /> : null}
        </div>
      </div>
    </section>
  )
}

function ProductSlides({ products }: { products: PublicProduct[] }) {
  return (
    <ScrollCarousel
      labelledBy={TITLE_ID}
      labels={{ previous: 'Producto anterior', next: 'Producto siguiente', goTo: (n) => `Ir al producto ${String(n)}` }}
    >
      {products.map((product, i) => (
        <div
          key={product.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${String(i + 1)} de ${String(products.length)}`}
          className="flex shrink-0 basis-full snap-start flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-4.5rem)/4)]"
        >
          <div aria-hidden="true" className="flex h-32 items-center justify-center bg-primary-fixed">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-lowest text-2xl font-bold text-primary">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h3 className="break-words text-lg font-bold">{product.name}</h3>
            {product.description ? (
              <p className="mt-2 line-clamp-2 text-base leading-6 text-on-surface-variant">{product.description}</p>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-4 pt-4">
              <p className="text-xl font-bold tabular-nums text-primary">{formatPrice(product.unitPrice)}</p>
              <Link
                to="/login?modo=registro"
                className={`shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-container ${focus}`}
              >
                Hacer pedido
              </Link>
            </div>
          </div>
        </div>
      ))}
    </ScrollCarousel>
  )
}
