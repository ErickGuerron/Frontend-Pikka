import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import auricularesPro from '@/assets/landing/auriculares-pro.jpg'
import cafeGalletas from '@/assets/landing/cafe-galletas.jpg'
import cajaSorpresa from '@/assets/landing/caja-sorpresa.jpg'
import kitFacial from '@/assets/landing/kit-facial.jpg'
import orquideas from '@/assets/landing/orquideas.jpg'
import pastelChocolate from '@/assets/landing/pastel-chocolate.jpg'

export interface CatalogItem {
  id: string
  refCode: string
  category: 'pasteleria' | 'regalos' | 'audio' | 'cafe' | 'dermocosmetica'
  categoryLabel: string
  title: string
  description: string
  price: number
  currency: string
  time: string
  badgeText: string
  badgeVariant?: 'primary' | 'teal' | 'container'
  rating: string
  image: string
}

export const FEATURED_PRODUCTS: CatalogItem[] = [
  {
    id: 'pk-01',
    refCode: 'REF: PK-01 · PASTELERÍA',
    category: 'pasteleria',
    categoryLabel: 'Pastelería',
    title: 'Pastel Triple Chocolate Belga & Frutos Rojos',
    description:
      'Cacao al 70%, ganache sedoso y frambuesas frescas. Se traslada en contenedor isotérmico con soporte nivelado.',
    price: 420,
    currency: 'MXN',
    time: '20–25 MIN',
    badgeText: 'MÁS PEDIDO',
    badgeVariant: 'teal',
    rating: '★ 4.9 (420)',
    image: pastelChocolate,
  },
  {
    id: 'pk-02',
    refCode: 'REF: PK-02 · REGALOS',
    category: 'regalos',
    categoryLabel: 'Regalos',
    title: 'Caja Sorpresa XXL & Globos Metalizados',
    description:
      'Chocolates finos, snacks importados y globo helio con tarjeta caligrafiada. Entrega en mano asegurada.',
    price: 890,
    currency: 'MXN',
    time: '25–30 MIN',
    badgeText: 'EDICIÓN REGALO',
    badgeVariant: 'container',
    rating: '★ 4.9 (189)',
    image: cajaSorpresa,
  },
  {
    id: 'pk-03',
    refCode: 'REF: PK-03 · AUDIO',
    category: 'audio',
    categoryLabel: 'Audio',
    title: 'Auriculares Pikka Studio Pro (Audio Hi-Res)',
    description:
      'Cancelación activa de ruido híbrida, 40 horas de autonomía y empaque acolchado con sello de fábrica.',
    price: 1450,
    currency: 'MXN',
    time: '15–20 MIN',
    badgeText: 'GARANTÍA 1 AÑO',
    badgeVariant: 'primary',
    rating: '★ 4.8 (94)',
    image: auricularesPro,
  },
  {
    id: 'pk-04',
    refCode: 'REF: PK-04 · CUIDADO',
    category: 'dermocosmetica',
    categoryLabel: 'Dermocosmética',
    title: 'Kit Suero Facial & Crema Reparadora 24h',
    description:
      'Ácido hialurónico con niacinamida pura. Almacenado bajo temperatura controlada para preservar principios activos.',
    price: 620,
    currency: 'MXN',
    time: '20–25 MIN',
    badgeText: 'DERMOCOSMÉTICA',
    badgeVariant: 'teal',
    rating: '★ 4.9 (312)',
    image: kitFacial,
  },
  {
    id: 'pk-05',
    refCode: 'REF: PK-05 · CAFÉ',
    category: 'cafe',
    categoryLabel: 'Café',
    title: 'Set Degustación Café de Especialidad & Galletas',
    description:
      'Granos arábica seleccionados de altura con perfil achocolatado, acompañados de galletas danesas horneadas hoy.',
    price: 380,
    currency: 'MXN',
    time: '20–25 MIN',
    badgeText: 'TUESTE RECIENTE',
    badgeVariant: 'primary',
    rating: '★ 4.9 (204)',
    image: cafeGalletas,
  },
  {
    id: 'pk-06',
    refCode: 'REF: PK-06 · FLORISTERÍA',
    category: 'regalos',
    categoryLabel: 'Regalos',
    title: 'Ramo Fresco de Orquídeas & Tarjeta Caligrafiada',
    description:
      'Vara de orquídeas con follaje en estuche vertical antigoteo. Incluye sobre lacrado con mensaje caligrafiado.',
    price: 750,
    currency: 'MXN',
    time: '25–30 MIN',
    badgeText: 'HIDRATACIÓN 48H',
    badgeVariant: 'container',
    rating: '★ 4.9 (156)',
    image: orquideas,
  },
]

interface ProductCarouselProps {
  query?: string
  onClearQuery?: () => void
  activeCategory?: string
  onSelectCategory?: (category: string) => void
}

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'pasteleria', label: 'Pastelería' },
  { id: 'regalos', label: 'Regalos' },
  { id: 'audio', label: 'Audio' },
  { id: 'cafe', label: 'Café' },
]

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function ProductCarousel({
  query = '',
  onClearQuery,
  activeCategory = 'all',
  onSelectCategory,
}: ProductCarouselProps) {
  const [localCategory, setLocalCategory] = useState('all')
  const currentCategory = onSelectCategory ? activeCategory : localCategory

  const handleTabClick = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId)
    } else {
      setLocalCategory(catId)
    }
  }

  const filtered = useMemo(() => {
    return FEATURED_PRODUCTS.filter((product) => {
      if (currentCategory !== 'all' && product.category !== currentCategory) {
        return false
      }
      if (!query.trim()) return true
      const q = normalize(query.trim())
      return (
        normalize(product.title).includes(q) ||
        normalize(product.description).includes(q) ||
        normalize(product.refCode).includes(q) ||
        normalize(product.categoryLabel).includes(q)
      )
    })
  }, [currentCategory, query])

  return (
    <section id="catalogo" aria-labelledby="catalogo-titulo" className="border-t border-[var(--landing-line)] bg-[var(--landing-bg)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section title & filter tabs */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--landing-line)] pb-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-block rounded border border-[var(--landing-line)] bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--landing-deep)]">
              SELECCIÓN OFICIAL · INVENTARIO CENTRAL
            </span>
            <h2 id="catalogo-titulo" className="text-2xl font-semibold tracking-tight text-[var(--landing-deep)] sm:text-3xl">
              Lo más pedido esta tarde
            </h2>
            <p className="mt-1 font-mono text-xs text-[var(--landing-muted)]">
              Disponibles para despacho inmediato con empaque certificado.
            </p>
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-xs uppercase tracking-wider">
            {TABS.map((tab) => {
              const active = currentCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`rounded px-3 py-1 transition-colors ${
                    active
                      ? 'border border-[var(--landing-deep)] bg-[var(--landing-deep)] text-white'
                      : 'border border-[var(--landing-line)] bg-white text-[var(--landing-deep)] hover:border-[var(--landing-deep)]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded border border-[var(--landing-line)] bg-white p-8 text-center font-mono">
            <p className="text-sm text-[var(--landing-deep)]">
              Ningún producto coincide con el filtro seleccionado.
            </p>
            {onClearQuery && (
              <button
                type="button"
                onClick={onClearQuery}
                className="mt-4 rounded-full border border-[var(--landing-deep)] bg-[var(--landing-deep)] px-5 py-1.5 text-xs uppercase tracking-wider text-white transition-colors hover:bg-[var(--landing-primary-hover)]"
              >
                Quitar filtro
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded border border-[var(--landing-line)] bg-white shadow-sm transition-[border-color,box-shadow] hover:border-[var(--landing-deep)]"
              >
                <div>
                  <div className="relative h-52 w-full overflow-hidden border-b border-[var(--landing-line)] bg-[var(--landing-tag-bg)]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded border border-[var(--landing-line)] bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--landing-deep)]">
                      {item.time}
                    </div>
                    <div
                      className={`absolute right-3 top-3 rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                        item.badgeVariant === 'teal'
                          ? 'bg-[var(--landing-deep)] text-[var(--landing-accent-light)]'
                          : item.badgeVariant === 'container'
                            ? 'bg-[var(--landing-primary-hover)] text-white'
                            : 'bg-[var(--landing-deep)] text-white'
                      }`}
                    >
                      {item.badgeText}
                    </div>
                  </div>

                  <div className="space-y-2 p-4 sm:p-5">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[var(--landing-muted)]">
                      <span className="uppercase tracking-wider">{item.refCode}</span>
                      <span className="font-bold text-[var(--landing-deep)]">{item.rating}</span>
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-[var(--landing-deep)]">
                      {item.title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-[var(--landing-muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--landing-line)] bg-[var(--landing-card)] px-4 pb-4 pt-3 sm:px-5">
                  <div>
                    <span className="block font-mono text-[9px] uppercase text-[var(--landing-muted)]">
                      PRECIO FINAL
                    </span>
                    <div className="font-mono text-base font-bold text-[var(--landing-deep)]">
                      ${item.price.toLocaleString('es-MX')}{' '}
                      <span className="font-mono text-[10px] font-normal text-[var(--landing-muted)]">
                        {item.currency}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/login?modo=registro"
                    className="flex items-center gap-1 rounded-full border border-[var(--landing-deep)] bg-[var(--landing-deep)] px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-[var(--landing-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
                  >
                    + Agregar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
