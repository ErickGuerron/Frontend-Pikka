import { ApiError } from '@/shared/api/errors'
import { localToday } from '@/features/orders/validation'
import { canCancel, type CustomerOrder, type NewCustomerOrder } from './types'

/**
 * In-memory demo adapter. It stands in for the customer endpoints, which the
 * gateway does not implement yet. It is only used when VITE_MOCK_CUSTOMER_ORDERS=true.
 */

/** Rough bounding box of the covered area (Quito). Points outside need operator review. */
const COVERED = { minLat: -0.45, maxLat: 0.05, minLng: -78.65, maxLng: -78.35 }

let counter = 0
let store: CustomerOrder[] = seed()

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setDate(d.getDate() + days)
  return localToday(d)
}

function nextId(): string {
  counter += 1
  const random = globalThis.crypto.randomUUID()
  return `${random.slice(0, 24)}${String(counter).padStart(12, '0')}`
}

function sample(partial: Partial<CustomerOrder> & Pick<CustomerOrder, 'id' | 'status'>): CustomerOrder {
  const today = localToday()
  return {
    address: 'Av. Amazonas N36-152, Quito',
    latitude: -0.1807,
    longitude: -78.4678,
    deliveryDate: today,
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
    sample({ id: 'a1b2c3d4-0000-4000-8000-000000000001', status: 'IN_TRANSIT', deliveryDate: today, windowStart: '15:00', windowEnd: '18:00' }),
    sample({
      id: 'b2c3d4e5-0000-4000-8000-000000000002',
      status: 'ROUTE_ASSIGNED',
      address: 'Calle Eloy Alfaro y Av. 6 de Diciembre, Quito',
      latitude: -0.1695,
      longitude: -78.4797,
      deliveryDate: addDays(today, 1),
      windowStart: '09:00',
      windowEnd: '12:00',
    }),
    sample({
      id: 'c3d4e5f6-0000-4000-8000-000000000003',
      status: 'PENDING',
      address: 'Av. República del Salvador N34-377, Quito',
      latitude: -0.1763,
      longitude: -78.4812,
      deliveryDate: addDays(today, 2),
    }),
    sample({
      id: 'd4e5f6a7-0000-4000-8000-000000000004',
      status: 'PENDING_REVIEW',
      address: 'Vía a Papallacta km 12, Pifo',
      latitude: -0.2376,
      longitude: -78.2931,
      deliveryDate: addDays(today, 3),
      reviewReasons: ['ZONE_NOT_COVERED'],
    }),
    sample({
      id: 'e5f6a7b8-0000-4000-8000-000000000005',
      status: 'DELIVERED',
      address: 'Av. Naciones Unidas E3-35, Quito',
      latitude: -0.1768,
      longitude: -78.4833,
      deliveryDate: addDays(today, -6),
      windowStart: '18:00',
      windowEnd: '21:00',
    }),
    sample({
      id: 'f6a7b8c9-0000-4000-8000-000000000006',
      status: 'CANCELLED',
      address: 'Calle Guayaquil N5-45, Quito',
      latitude: -0.2202,
      longitude: -78.5123,
      deliveryDate: addDays(today, -10),
      windowStart: '09:00',
      windowEnd: '12:00',
    }),
  ]
}

function isCovered(latitude: number, longitude: number): boolean {
  return latitude >= COVERED.minLat && latitude <= COVERED.maxLat && longitude >= COVERED.minLng && longitude <= COVERED.maxLng
}

export function listDemoOrders(): Promise<CustomerOrder[]> {
  return Promise.resolve(store.map((order) => ({ ...order })))
}

/** New orders start PENDING; the demo flags uncovered points as PENDING_REVIEW like the validation would. */
export function createDemoOrder(input: NewCustomerOrder): Promise<CustomerOrder> {
  const covered = isCovered(input.latitude, input.longitude)
  const order: CustomerOrder = {
    id: nextId(),
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
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

/** Restores the sample data. Used by tests. */
export function resetDemoOrders(): void {
  counter = 0
  store = seed()
}
