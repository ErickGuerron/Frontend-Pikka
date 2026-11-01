import { isRecord, ParseError, string } from '../../api/parse'
import { MAX_LINE_QUANTITY, type OrderLine } from './types'

/** Product as the gateway returns it; `stockQuantity` only exists when the product tracks stock. */
export interface Product {
  id: string
  name: string
  unitPrice: string
  active: boolean
  stockQuantity: number | undefined
}

export function parseProduct(data: unknown): Product {
  if (!isRecord(data)) throw new ParseError('product: expected object')
  // The gateway sends null (not an omitted field) when the product does not track stock.
  const stock = data.stockQuantity ?? undefined
  if (stock !== undefined && typeof stock !== 'number') throw new ParseError('stockQuantity: expected number')
  if (typeof data.active !== 'boolean') throw new ParseError('active: expected boolean')
  return { id: string(data, 'id'), name: string(data, 'name'), unitPrice: string(data, 'unitPrice'), active: data.active, stockQuantity: stock }
}

/** The gateway answers `{ products: [...] }`. */
export function parseProducts(data: unknown): Product[] {
  if (!isRecord(data) || !Array.isArray(data.products)) throw new ParseError('products: expected list')
  return data.products.map(parseProduct)
}

/** Price in whole cents: avoids floating point drift when adding lines. */
export function toCents(unitPrice: string): number {
  return Math.round(Number(unitPrice) * 100)
}

export function formatCents(total: number): string {
  return `$${(total / 100).toFixed(2)}`
}

/** Line cap: the contract limit, or the available stock when the product tracks it. */
export function maxQuantity(product: Product): number {
  return product.stockQuantity === undefined ? MAX_LINE_QUANTITY : Math.max(0, Math.min(MAX_LINE_QUANTITY, product.stockQuantity))
}

export interface PricedLine extends OrderLine {
  name: string
  cents: number
}

/** Joins order lines with the catalog; unknown products keep a generic name and cost 0. */
export function priceLines(lines: readonly OrderLine[], catalog: readonly Product[]): PricedLine[] {
  return lines.map((line) => {
    const product = catalog.find((p) => p.id === line.productId)
    return { ...line, name: product?.name ?? 'Producto', cents: product === undefined ? 0 : toCents(product.unitPrice) }
  })
}

export function totalCents(lines: readonly PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.cents * line.quantity, 0)
}
