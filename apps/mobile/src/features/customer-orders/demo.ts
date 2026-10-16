import { ApiError } from '../../api/errors'
import type { Product } from './products'
import { canCancel, localToday, type CustomerOrder, type NewCustomerOrder } from './types'

/**
 * In-memory DEMO adapter. It stands in for the customer endpoints, which the gateway does not
 * implement yet. Only used when EXPO_PUBLIC_MOCK_CUSTOMER_ORDERS=true.
 */

let counter = 0
let store: CustomerOrder[] = seed()

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setDate(d.getDate() + days)
  return localToday(d)
}

function nextId(): string {
  counter += 1
  const random = Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12)
  return `${random}-0000-4000-8000-${String(counter).padStart(12, '0')}`
}

function sample(partial: Partial<CustomerOrder> & Pick<CustomerOrder, 'id' | 'status'>): CustomerOrder {
  return {
    address: 'Av. Amazonas N36-152, Quito',
    deliveryDate: localToday(),
    windowStart: '12:00',
    windowEnd: '15:00',
    reviewReasons: [],
    createdAt: new Date().toISOString(),
    ...partial,
  }
}

function seed(): CustomerOrder[] {
  const today = localToday()
  return [
    sample({ id: 'a1b2c3d4-0000-4000-8000-000000000001', status: 'IN_TRANSIT', windowStart: '15:00', windowEnd: '18:00' }),
    sample({ id: 'b2c3d4e5-0000-4000-8000-000000000002', status: 'ROUTE_ASSIGNED', address: 'Calle Eloy Alfaro y Av. 6 de Diciembre, Quito', deliveryDate: addDays(today, 1), windowStart: '09:00', windowEnd: '12:00' }),
    sample({ id: 'c3d4e5f6-0000-4000-8000-000000000003', status: 'PENDING', address: 'Av. República del Salvador N34-377, Quito', deliveryDate: addDays(today, 2) }),
    sample({ id: 'd4e5f6a7-0000-4000-8000-000000000004', status: 'PENDING_REVIEW', address: 'Vía a Papallacta km 12, Pifo', deliveryDate: addDays(today, 3), reviewReasons: ['ZONE_NOT_COVERED'] }),
    sample({ id: 'e5f6a7b8-0000-4000-8000-000000000005', status: 'DELIVERED', address: 'Av. Naciones Unidas E3-35, Quito', deliveryDate: addDays(today, -6), windowStart: '18:00', windowEnd: '21:00' }),
    sample({ id: 'f6a7b8c9-0000-4000-8000-000000000006', status: 'CANCELLED', address: 'Calle Guayaquil N5-45, Quito', deliveryDate: addDays(today, -10), windowStart: '09:00', windowEnd: '12:00' }),
  ]
}

/** Without a geocoder, the demo treats addresses that do not mention Quito as outside the covered area. */
export function isCoveredAddress(address: string): boolean {
  return address.toLowerCase().includes('quito')
}

export function listDemoOrders(): Promise<CustomerOrder[]> {
  return Promise.resolve(store.map((order) => ({ ...order })))
}

/** Fixed catalog for demo mode; one product tracks stock and one is sold out. */
export function listDemoProducts(): Product[] {
  return [
    { id: 'p-agua-20l', name: 'Agua 20 L', unitPrice: '3.50', active: true, stockQuantity: undefined },
    { id: 'p-agua-5l', name: 'Agua 5 L', unitPrice: '1.25', active: true, stockQuantity: 8 },
    { id: 'p-hielo', name: 'Hielo 5 kg', unitPrice: '2.00', active: true, stockQuantity: 0 },
    { id: 'p-retirado', name: 'Producto retirado', unitPrice: '9.99', active: false, stockQuantity: undefined },
  ]
}

/** New orders start PENDING; uncovered addresses go to PENDING_REVIEW like the real validation would. */
export function createDemoOrder(input: NewCustomerOrder): Promise<CustomerOrder> {
  if (input.items.length === 0) {
    return Promise.reject(new ApiError(400, 'VALIDATION_ERROR', 'order must contain at least one product'))
  }
  const covered = isCoveredAddress(input.address)
  const order: CustomerOrder = {
    id: nextId(),
    address: input.address.trim(),
    deliveryDate: input.deliveryDate,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    status: covered ? 'PENDING' : 'PENDING_REVIEW',
    reviewReasons: covered ? [] : ['ZONE_NOT_COVERED'],
    createdAt: new Date().toISOString(),
  }
  store = [order, ...store]
  return Promise.resolve({ ...order })
}

/** Cancelling is only allowed in PENDING or ROUTE_ASSIGNED; any other status is a conflict. */
export function cancelDemoOrder(id: string): Promise<CustomerOrder> {
  const found = store.find((order) => order.id === id)
  if (found === undefined) return Promise.reject(new ApiError(404, 'NOT_FOUND', 'order not found'))
  if (!canCancel(found.status)) {
    return Promise.reject(new ApiError(409, 'CONFLICT', `order in status ${found.status} cannot be cancelled`))
  }
  const cancelled: CustomerOrder = { ...found, status: 'CANCELLED' }
  store = store.map((order) => (order.id === id ? cancelled : order))
  return Promise.resolve({ ...cancelled })
}

export function resetDemoOrders(): void {
  counter = 0
  store = seed()
}
