import { expect, test } from '@playwright/test'
import { loginAsAdmin, mockAuth } from './support'

const drivers = [
  { id: 'd-1', fullName: 'Luis Andrade', phone: '0991112233', city: 'Quito', vehicleType: 'MOTORIZADO', plate: 'PBA1234', active: true, status: 'AVAILABLE' },
  { id: 'd-2', fullName: 'María Paredes', phone: '0992223344', city: 'Cuenca', vehicleType: 'SUV', plate: 'CAB5678', active: true, status: 'ON_ROUTE' },
]

const plan = {
  id: 'plan-1',
  routes: [
    {
      id: 'route-1',
      driverId: 'd-1',
      driverName: 'Luis Andrade',
      stops: [{ orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1 }],
    },
    { id: 'route-2', driverId: 'd-2', driverName: 'María Paredes', stops: [] },
  ],
  unassignedOrderIds: ['o-9'],
}

// Real response of POST /api/v1/routes/plan: planId and routeId instead of id, plus orderCount.
const generatedPlan = {
  planId: plan.id,
  routes: plan.routes.map((r) => ({ routeId: r.id, driverId: r.driverId, driverName: r.driverName, orderCount: r.stops.length, stops: r.stops })),
  unassignedOrderIds: plan.unassignedOrderIds,
}

const trackedRoutes = [
  {
    id: 'route-1',
    driverName: 'Luis Andrade',
    stops: [
      { orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1, status: 'DELIVERED' },
      { orderId: 'o-2', address: 'Calle Juan León Mera 1224', sequence: 2, status: 'IN_TRANSIT' },
    ],
  },
]

test('el operador ve los repartidores con su estado y filtra por nombre', async ({ page }) => {
  await mockAuth(page)
  await page.route('**/api/v1/drivers', (route) => route.fulfill({ json: drivers }))
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Repartidores', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Repartidores', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Luis Andrade' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'PBA1234' })).toBeVisible()

  await page.getByLabel('Buscar').fill('paredes')
  await expect(page.getByRole('cell', { name: 'Luis Andrade' })).toHaveCount(0)
  await expect(page.getByRole('cell', { name: 'María Paredes' })).toBeVisible()
})

test('el operador crea rutas con confirmación y suma un pedido nuevo a una ruta en proceso', async ({ page }) => {
  await mockAuth(page)
  const day = '2026-11-18'
  const order = (id: string, address: string) => ({
    id, address, latitude: -0.18, longitude: -78.47, deliveryDate: day, windowStart: '09:00', windowEnd: '18:00',
    status: 'PENDING', reviewReasons: [], createdAt: '2026-11-18T12:00:00Z',
  })
  await page.route('**/api/v1/orders', (route) => route.fulfill({ json: [order('n-1', 'Calle Nueva 1'), order('n-2', 'Calle Nueva 2')] }))
  await page.route('**/api/v1/tracking/routes/active', (route) =>
    route.fulfill({
      json: [{ id: `${day}-zona-1`, driverName: 'Camila Torres', stops: [{ orderId: 'a-1', address: 'Av. Amazonas N24-03', sequence: 1, status: 'IN_TRANSIT' }] }],
    }),
  )
  const plans: unknown[] = []
  await page.route('**/api/v1/routes/plan', async (route) => {
    plans.push(route.request().postDataJSON())
    await route.fulfill({ json: generatedPlan })
  })
  const adds: string[] = []
  await page.route('**/api/v1/routes/*/orders', async (route) => {
    adds.push(route.request().url())
    await route.fulfill({ status: 201, json: { routeId: `${day}-zona-1`, stop: { orderId: 'n-1', address: 'Calle Nueva 1', sequence: 2 } } })
  })
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Rutas', exact: true }).click()

  // Rutas en proceso y pedidos nuevos a la vista.
  await expect(page.getByRole('region', { name: 'Rutas en proceso' }).getByRole('heading', { name: 'Camila Torres' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Nuevos pedidos' }).getByText('Calle Nueva 1')).toBeVisible()

  // Crear rutas solo propone; nada se asigna hasta confirmar.
  await page.getByRole('button', { name: /Crear rutas/ }).click()
  await expect(page.getByRole('region', { name: 'Propuesta de rutas' }).getByText('Aún sin asignar')).toBeVisible()
  expect(plans).toEqual([{ deliveryDate: day, dryRun: true }])
  await page.getByRole('button', { name: 'Confirmar y asignar' }).click()
  await expect(page.getByText(/Rutas asignadas: 2/)).toBeVisible()
  expect(plans).toEqual([{ deliveryDate: day, dryRun: true }, { deliveryDate: day }])

  // Sumar un pedido nuevo a la ruta que ya está en ejecución.
  await page.getByRole('button', { name: 'Agregar a ruta' }).first().click()
  await expect(page.getByText(/Pedido agregado como parada 2/)).toBeVisible()
  expect(adds).toHaveLength(1)
  expect(adds[0]).toContain(`/api/v1/routes/${day}-zona-1/orders`)
})

test('el seguimiento refleja el cambio de estado de una parada sin recargar', async ({ page }) => {
  await mockAuth(page)
  await page.route('**/api/v1/orders', (route) => route.fulfill({ json: [] }))
  let stopStatus = 'IN_TRANSIT'
  await page.route('**/api/v1/tracking/routes/active', (route) =>
    route.fulfill({
      json: [
        {
          id: 'route-1',
          driverName: 'Luis Andrade',
          stops: [{ orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1, status: stopStatus }],
        },
      ],
    }),
  )
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Seguimiento', exact: true }).click()
  await expect(page.getByText('En camino')).toBeVisible()

  // El repartidor marca la entrega; el seguimiento se actualiza solo cada 3 minutos o al pulsar Actualizar.
  stopStatus = 'DELIVERED'
  await page.getByRole('button', { name: 'Actualizar' }).click()
  await expect(page.getByText('Entregado')).toBeVisible()
  await expect(page.getByText('En camino')).toHaveCount(0)
})

test('el operador ve el estado de cada parada en seguimiento', async ({ page }) => {
  await mockAuth(page)
  await page.route('**/api/v1/orders', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/tracking/routes/active', (route) => route.fulfill({ json: trackedRoutes }))
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Seguimiento', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seguimiento', exact: true })).toBeVisible()
  await expect(page.getByText('Entregado')).toBeVisible()
  await expect(page.getByText('En camino')).toBeVisible()
  await expect(page.getByText('1 paradas abiertas')).toBeVisible()
})
