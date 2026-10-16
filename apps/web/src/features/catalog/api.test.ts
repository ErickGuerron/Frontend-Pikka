import { describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { mockApi, sentBody } from '@/test/utils'
import { adjustProductStock, createProduct, listProducts, listStockMovements, setProductActive } from './api'

const productId = '44444444-4444-4444-4444-444444444444'
const product = {
  id: productId,
  name: 'Agua 1L',
  description: 'Botella',
  unitPrice: '2.50',
  active: true,
  stockQuantity: 10,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}
const movement = {
  id: '55555555-5555-5555-5555-555555555555',
  productId,
  type: 'RESTOCK',
  delta: 10,
  resultingStock: 10,
  createdAt: '2026-10-01T00:00:00Z',
}

describe('API de catálogo', () => {
  it('lista el catálogo desde la respuesta { products } y pide inactivos solo si se indica', async () => {
    useSession.getState().setToken('tok')
    const fetchMock = mockApi(() => ({ status: 200, body: { products: [product] } }))

    expect(await listProducts(false)).toEqual([product])
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('includeInactive')

    await listProducts(true)
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('includeInactive=true')
  })

  it('acepta stockQuantity null (producto sin control de stock) como ausente', async () => {
    useSession.getState().setToken('tok')
    mockApi(() => ({ status: 200, body: { products: [{ ...product, stockQuantity: null }] } }))

    expect((await listProducts(false))[0]?.stockQuantity).toBeUndefined()
  })

  it('crea un producto enviando el precio como texto y el stock como initialStock', async () => {
    useSession.getState().setToken('tok')
    const fetchMock = mockApi(() => ({ status: 201, body: product }))

    await createProduct({ name: 'Agua 1L', description: 'Botella', unitPrice: '2.50', initialStock: 10 })

    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(sentBody(fetchMock.mock.calls[0]?.[1])).toEqual({
      name: 'Agua 1L',
      description: 'Botella',
      unitPrice: '2.50',
      initialStock: 10,
    })
  })

  it('activa o retira un producto con PATCH', async () => {
    useSession.getState().setToken('tok')
    const fetchMock = mockApi(() => ({ status: 200, body: { ...product, active: false } }))

    const updated = await setProductActive(productId, false)

    expect(updated.active).toBe(false)
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PATCH')
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(new RegExp(`/api/v1/products/${productId}/active$`))
    expect(sentBody(fetchMock.mock.calls[0]?.[1])).toEqual({ active: false })
  })

  it('registra un ajuste de stock y devuelve el movimiento', async () => {
    useSession.getState().setToken('tok')
    const fetchMock = mockApi(() => ({ status: 201, body: movement }))

    const result = await adjustProductStock(productId, { type: 'RESTOCK', delta: 10 })

    expect(result.resultingStock).toBe(10)
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(new RegExp(`/api/v1/products/${productId}/stock-adjustments$`))
    expect(sentBody(fetchMock.mock.calls[0]?.[1])).toEqual({ type: 'RESTOCK', delta: 10 })
  })

  it('lee el historial desde la respuesta { movements }', async () => {
    useSession.getState().setToken('tok')
    mockApi(() => ({ status: 200, body: { movements: [movement] } }))

    expect(await listStockMovements(productId)).toEqual([movement])
  })
})
