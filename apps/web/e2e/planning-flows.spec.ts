import { expect, test } from '@playwright/test'
import { loginAsAdmin, mockAuth } from './support'

const drivers = [
  { id: 'd-1', fullName: 'Luis Andrade', phone: '0991112233', active: true, status: 'AVAILABLE' },
  { id: 'd-2', fullName: 'María Paredes', phone: '0992223344', active: true, status: 'ON_ROUTE' },
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

  await page.getByLabel('Buscar').fill('paredes')
  await expect(page.getByRole('cell', { name: 'Luis Andrade' })).toHaveCount(0)
  await expect(page.getByRole('cell', { name: 'María Paredes' })).toBeVisible()
})

test('el operador genera rutas y asigna un pedido de último momento', async ({ page }) => {
  await mockAuth(page)
  const requests: unknown[] = []
  await page.route('**/api/v1/route-plans/generate', (route) => route.fulfill({ json: plan }))
  await page.route('**/api/v1/route-plans/plan-1/stops', async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({
      json: {
        ...plan,
        routes: [
          {
            id: 'route-1',
            driverId: 'd-1',
            driverName: 'Luis Andrade',
            stops: [
              { orderId: 'o-1', address: 'Av. Amazonas N24-03', sequence: 1 },
              { orderId: 'o-9', address: 'Pedido o-9', sequence: 2 },
            ],
          },
          { id: 'route-2', driverId: 'd-2', driverName: 'María Paredes', stops: [] },
        ],
        unassignedOrderIds: [],
      },
    })
  })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Rutas', exact: true }).click()
  await page.getByRole('button', { name: 'Generar rutas' }).click()
  await expect(page.getByRole('heading', { name: 'Luis Andrade' })).toBeVisible()

  await page.getByRole('button', { name: 'Asignar' }).click()
  await expect(page.getByRole('region', { name: 'Pedidos sin repartidor' })).toHaveCount(0)
  await expect(page.locator('li', { hasText: 'Pedido o-9' }).first()).toBeVisible()
  expect(requests).toEqual([{ orderId: 'o-9', routeId: 'route-1' }])
})

test('el seguimiento refleja el cambio de estado de una parada sin recargar', async ({ page }) => {
  await mockAuth(page)
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

  // El repartidor marca la entrega; el seguimiento lo recoge en el siguiente refresco (10 s).
  stopStatus = 'DELIVERED'
  await expect(page.getByText('Entregado')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('En camino')).toHaveCount(0)
})

test('el operador ve el estado de cada parada en seguimiento', async ({ page }) => {
  await mockAuth(page)
  await page.route('**/api/v1/tracking/routes/active', (route) => route.fulfill({ json: trackedRoutes }))
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Seguimiento', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seguimiento', exact: true })).toBeVisible()
  await expect(page.getByText('Entregado')).toBeVisible()
  await expect(page.getByText('En camino')).toBeVisible()
  await expect(page.getByText('1 paradas abiertas')).toBeVisible()
})
