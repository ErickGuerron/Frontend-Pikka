import type { RoutePlan } from './types'

/** Plan de muestra para VITE_MOCK_ROUTING=true. Nada se guarda ni se envía. */
export function generateDemoRoutePlan(): Promise<RoutePlan> {
  return Promise.resolve({
    id: 'plan-demo-1',
    routes: [
      {
        id: 'route-1',
        driverId: 'd-1',
        driverName: 'Luis Andrade',
        stops: [
          { orderId: 'o-1', address: 'Av. Amazonas N24-03, Quito', sequence: 1 },
          { orderId: 'o-2', address: 'Calle Juan León Mera 1224, Quito', sequence: 2 },
        ],
      },
      {
        id: 'route-2',
        driverId: 'd-3',
        driverName: 'Jorge Vélez',
        stops: [{ orderId: 'o-3', address: 'Av. 6 de Diciembre 2540, Quito', sequence: 1 }],
      },
    ],
    unassignedOrderIds: ['o-4'],
  })
}
