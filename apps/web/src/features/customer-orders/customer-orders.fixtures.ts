import type { CustomerOrder } from './types'

/** Pedido de cliente con valores por defecto válidos; cada prueba sobrescribe solo lo que necesita. */
export const order = (over: Partial<CustomerOrder>): CustomerOrder => ({
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  address: 'Av. Central 123',
  latitude: -0.2,
  longitude: -78.5,
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '12:00',
  status: 'PENDING',
  reviewReasons: [],
  createdAt: '2026-10-10T12:00:00Z',
  queuePosition: 0,
  ...over,
})
