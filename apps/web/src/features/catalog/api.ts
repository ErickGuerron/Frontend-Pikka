import { http } from '@/shared/api/client'
import { parseProduct, parseProducts, parseStockMovement, parseStockMovements, type Product, type StockAdjustmentType, type StockMovement } from './types'

/** Rutas publicadas en contracts/openapi/openapi.yaml (ADR 0009). */
export interface NewProductBody {
  name: string
  description?: string
  unitPrice: string
  initialStock?: number
}

export interface StockAdjustmentBody {
  type: StockAdjustmentType
  delta: number
  reason?: string
}

/** Un CUSTOMER solo ve activos; pedir inactivos como cliente responde 403, así que no se envía. */
export function listProducts(includeInactive: boolean, signal?: AbortSignal): Promise<Product[]> {
  const query = includeInactive ? '?includeInactive=true' : ''
  return http.get(`/api/v1/products${query}`, parseProducts, { signal })
}

export function createProduct(input: NewProductBody): Promise<Product> {
  return http.post('/api/v1/products', parseProduct, { body: input })
}

export function setProductActive(id: string, active: boolean): Promise<Product> {
  return http.patch(`/api/v1/products/${encodeURIComponent(id)}/active`, parseProduct, { body: { active } })
}

export function adjustProductStock(id: string, input: StockAdjustmentBody): Promise<StockMovement> {
  return http.post(`/api/v1/products/${encodeURIComponent(id)}/stock-adjustments`, parseStockMovement, { body: input })
}

export function listStockMovements(id: string, signal?: AbortSignal): Promise<StockMovement[]> {
  return http.get(`/api/v1/products/${encodeURIComponent(id)}/stock-movements`, parseStockMovements, { signal })
}
