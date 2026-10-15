import { boolean, enumValue, number, object, string, ParseError } from '@/shared/api/parse'
import { isRecord } from '@/shared/api/http'

/** Producto según el contrato. `stockQuantity` solo existe cuando el producto controla stock. */
export interface Product {
  id: string
  name: string
  description: string | undefined
  unitPrice: string
  active: boolean
  stockQuantity: number | undefined
  createdAt: string
  updatedAt: string
}

export const stockAdjustmentTypes = ['RESTOCK', 'ADJUSTMENT'] as const
export type StockAdjustmentType = (typeof stockAdjustmentTypes)[number]

export const stockAdjustmentLabels: Record<StockAdjustmentType, string> = {
  RESTOCK: 'Entrada (reposición)',
  ADJUSTMENT: 'Ajuste manual',
}

const movementTypes = ['RESTOCK', 'ADJUSTMENT', 'SALE', 'RETURN'] as const
export type MovementType = (typeof movementTypes)[number]

export const movementLabels: Record<MovementType, string> = {
  RESTOCK: 'Entrada',
  ADJUSTMENT: 'Ajuste',
  SALE: 'Venta',
  RETURN: 'Devolución',
}

export interface StockMovement {
  id: string
  productId: string
  type: MovementType
  delta: number
  resultingStock: number
  reason: string | undefined
  createdAt: string
}

function optionalString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new ParseError(`${key}: expected string`)
  return value
}

export function parseProduct(data: unknown): Product {
  const obj = object(data, 'product')
  const stock = obj.stockQuantity
  if (stock !== undefined && typeof stock !== 'number') throw new ParseError('stockQuantity: expected number')
  return {
    id: string(obj, 'id'),
    name: string(obj, 'name'),
    description: optionalString(obj, 'description'),
    unitPrice: string(obj, 'unitPrice'),
    active: boolean(obj, 'active'),
    stockQuantity: stock,
    createdAt: string(obj, 'createdAt'),
    updatedAt: string(obj, 'updatedAt'),
  }
}

/** El gateway responde `{ products: [...] }`. */
export function parseProducts(data: unknown): Product[] {
  if (!isRecord(data) || !Array.isArray(data.products)) throw new ParseError('products: expected list')
  return data.products.map((item) => parseProduct(item))
}

export function parseStockMovement(data: unknown): StockMovement {
  const obj = object(data, 'stockMovement')
  return {
    id: string(obj, 'id'),
    productId: string(obj, 'productId'),
    type: enumValue(obj.type, movementTypes, 'type'),
    delta: number(obj, 'delta'),
    resultingStock: number(obj, 'resultingStock'),
    reason: optionalString(obj, 'reason'),
    createdAt: string(obj, 'createdAt'),
  }
}

/** El gateway responde `{ movements: [...] }`. */
export function parseStockMovements(data: unknown): StockMovement[] {
  if (!isRecord(data) || !Array.isArray(data.movements)) throw new ParseError('movements: expected list')
  return data.movements.map((item) => parseStockMovement(item))
}
