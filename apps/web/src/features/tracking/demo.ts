import type { TrackedRoute } from './types'

/** Rutas en curso de muestra para VITE_MOCK_TRACKING=true. Nada se guarda ni se envía. */
export function listDemoActiveRoutes(): Promise<TrackedRoute[]> {
  return Promise.resolve([
    {
      id: 'route-1',
      driverName: 'Luis Andrade',
      stops: [
        { orderId: 'o-1', address: 'Av. Amazonas N24-03, Quito', sequence: 1, status: 'DELIVERED' },
        { orderId: 'o-2', address: 'Calle Juan León Mera 1224, Quito', sequence: 2, status: 'IN_TRANSIT' },
        { orderId: 'o-5', address: 'Av. 12 de Octubre N26-27, Quito', sequence: 3, status: 'PENDING' },
      ],
    },
    {
      id: 'route-2',
      driverName: 'Jorge Vélez',
      stops: [{ orderId: 'o-3', address: 'Av. 6 de Diciembre 2540, Quito', sequence: 1, status: 'PICKED_UP' }],
    },
  ])
}
