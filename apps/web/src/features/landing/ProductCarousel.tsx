import { Link } from 'react-router'
import { placeholderColor } from '@/shared/ui/product-color'
import { ScrollCarousel } from './ScrollCarousel'
import { filterProducts, formatPrice, usePublicProducts, type PublicProduct } from './catalog'

const TITLE_ID = 'catalogo-titulo'
const SKELETON_CARDS = 3
const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2'
const primaryButton = `rounded-full border border-[var(--landing-deep)] bg-primary px-5 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-primary-container ${focus}`

const slideBasis = 'basis-full md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]'

interface ProductCarouselProps {
  /** Texto del buscador de cabecera; filtra por nombre cuando el catálogo ya cargó. */
  query?: string
  onClearQuery?: () => void
}

/** Catálogo público con datos reales del API. Sin stock ni calificaciones: nombre, descripción, precio y pedido. */
export function ProductCarousel({ query = '', onClearQuery }: ProductCarouselProps) {
  const { data: products, isPending, isError, isFetching, refetch } = usePublicProducts()

  // Sin productos la sección no aporta nada: se oculta en lugar de mostrar un hueco.
  if (!isPending && !isError && products.length === 0) return null

  const visible = isPending || isError ? [] : filterProducts(products, query)

  return (
    <section id="catalogo" className="scroll-mt-20 border-t border-[var(--landing-line)] bg-[var(--landing-bg)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 border-b border-[var(--landing-line)] pb-4">
          <h2 id={TITLE_ID} className="text-2xl font-semibold tracking-tight text-[var(--landing-deep)] sm:text-3xl">
            Catálogo
          </h2>
          <p className="mt-1 font-mono text-xs text-[var(--landing-muted)]">Elige un producto y haz tu pedido con tu cuenta.</p>
        </div>

        {isPending ? (
          <div data-testid="products-skeleton" aria-busy="true" className="flex gap-6 overflow-hidden">
            <p className="sr-only">Cargando productos…</p>
            {Array.from({ length: SKELETON_CARDS }, (_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className={`h-64 shrink-0 animate-pulse rounded border border-[var(--landing-line)] bg-[var(--landing-tag-bg)] motion-reduce:animate-none ${slideBasis}`}
              />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div role="alert" className="rounded border border-[var(--landing-line)] bg-white p-6 font-mono">
            <p className="text-sm font-semibold text-[var(--landing-deep)]">No pudimos cargar los productos.</p>
            <p className="mt-1 text-xs text-[var(--landing-muted)]">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              type="button"
              disabled={isFetching}
              onClick={() => {
                void refetch()
              }}
              className={`mt-4 disabled:cursor-not-allowed disabled:opacity-40 ${primaryButton}`}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isPending && !isError && visible.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded border border-[var(--landing-line)] bg-white p-6 font-mono">
            <p role="status" className="text-sm text-[var(--landing-deep)]">
              Ningún producto coincide con “{query}”.
            </p>
            {onClearQuery ? (
              <button type="button" onClick={onClearQuery} className={primaryButton}>
                Quitar filtro
              </button>
            ) : null}
          </div>
        ) : null}

        {visible.length > 0 ? <ProductSlides products={visible} /> : null}
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
          className={`flex shrink-0 snap-start flex-col overflow-hidden rounded border border-[var(--landing-line)] bg-white shadow-sm lg:basis-[calc((100%-3rem)/3)] ${slideBasis}`}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" loading="lazy" className="h-44 w-full border-b border-[var(--landing-line)] object-cover" />
          ) : (
            <div
              aria-hidden="true"
              style={{ backgroundColor: placeholderColor(product.id) }}
              className="flex h-44 items-center justify-center border-b border-[var(--landing-line)]"
            >
              <span className="text-5xl font-bold text-[var(--landing-deep)]/70">{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <h3 className="break-words text-base font-semibold tracking-tight text-[var(--landing-deep)]">{product.name}</h3>
            {product.description ? (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--landing-muted)]">{product.description}</p>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-4 pt-4">
              <p className="font-mono text-base font-bold tabular-nums text-[var(--landing-deep)]">{formatPrice(product.unitPrice)}</p>
              <Link to="/login?modo=registro" className={`shrink-0 ${primaryButton}`}>
                Hacer pedido
              </Link>
            </div>
          </div>
        </div>
      ))}
    </ScrollCarousel>
  )
}
