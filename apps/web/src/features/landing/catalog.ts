import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api/client'
import { isRecord } from '@/shared/api/http'
import { ParseError, string } from '@/shared/api/parse'

/** Producto del catálogo público: solo lo que se muestra, sin stock. */
export interface PublicProduct {
  id: string
  name: string
  description: string | undefined
  /** Decimal en USD tal como lo envía el API, p. ej. "12.50". */
  unitPrice: string
}

const decimalPrice = /^\d+(\.\d{1,2})?$/

export function parsePublicProducts(data: unknown): PublicProduct[] {
  if (!isRecord(data) || !Array.isArray(data.products)) throw new ParseError('products: expected list')
  return data.products.map((item) => {
    if (!isRecord(item)) throw new ParseError('product: expected object')
    const unitPrice = string(item, 'unitPrice')
    if (!decimalPrice.test(unitPrice)) throw new ParseError('unitPrice: expected decimal')
    const description = typeof item.description === 'string' && item.description !== '' ? item.description : undefined
    return { id: string(item, 'id'), name: string(item, 'name'), description, unitPrice }
  })
}

const usd = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })

export function formatPrice(unitPrice: string): string {
  return usd.format(Number(unitPrice))
}

const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** Filtra por nombre, sin distinguir mayúsculas ni acentos. Una búsqueda vacía devuelve todo. */
export function filterProducts(products: PublicProduct[], query: string): PublicProduct[] {
  const needle = normalizeText(query)
  return needle === '' ? products : products.filter((p) => normalizeText(p.name).includes(needle))
}

export const publicCatalogKey = ['landing', 'public-products'] as const

/** Catálogo público: sin sesión, así que no se envía token aunque haya uno guardado. */
export function usePublicProducts() {
  return useQuery({
    queryKey: publicCatalogKey,
    queryFn: ({ signal }) => http.get('/api/v1/catalog/products', parsePublicProducts, { signal, auth: false }),
  })
}
