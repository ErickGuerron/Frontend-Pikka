import { expect, test, type Page } from '@playwright/test'

// Flujos de la app movil (apps/mobile) en su build web: login por rol, pedidos del cliente,
// ruta del repartidor y cierre de sesion. El gateway se simula con page.route.

const customer = {
  id: '22222222-2222-2222-2222-222222222222',
  email: 'cliente@example.com',
  fullName: 'Carla Cliente',
  role: 'CUSTOMER',
  active: true,
  createdAt: '2026-10-03T00:00:00Z',
}

const driver = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'repartidor@example.com',
  fullName: 'Lucas Martinez',
  role: 'DRIVER',
  active: true,
  createdAt: '2026-10-03T00:00:00Z',
}

const customerOrder = {
  id: 'order-1',
  address: 'Av. Amazonas 100',
  deliveryDate: '2026-10-25',
  windowStart: '10:00',
  windowEnd: '12:00',
  status: 'PENDING',
  reviewReasons: [],
  createdAt: '2026-10-24T09:00:00Z',
}

const driverRoute = {
  id: 'route-1',
  stops: [
    {
      id: 'stop-1',
      sequence: 1,
      address: 'Calle Larga 5',
      windowStart: '10:00',
      windowEnd: '12:00',
      status: 'PENDING',
      reason: null,
    },
  ],
}

// Un unico usuario por clave: el login devuelve la sesion del rol que corresponde.
const users: Record<string, typeof customer> = {
  'cliente-password': customer,
  'repartidor-password': driver,
}

async function mockGateway(page: Page) {
  // Catch-all registrado primero (menor prioridad): cualquier /api no mockeado queda aislado aqui.
  await page.route('**/api/**', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/auth/login', async (route) => {
    const body: unknown = route.request().postDataJSON()
    const password = typeof body === 'object' && body !== null && 'password' in body ? String(body.password) : ''
    const user = users[password]
    if (user === undefined) {
      await route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'invalid credentials' } } })
      return
    }
    await route.fulfill({ json: { accessToken: 'tok', tokenType: 'Bearer', expiresIn: 3600, user } })
  })
  // /auth/me responde segun el token que la app guardo tras el login.
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: route.request().headers().authorization ? currentUser : customer }))
  await page.route('**/api/v1/orders/mine', (route) => route.fulfill({ json: { orders: [customerOrder] } }))
  await page.route('**/api/v1/drivers/me/route', (route) => route.fulfill({ json: driverRoute }))
}

// Usuario de la sesion activa; se ajusta antes de cada login.
let currentUser = customer

async function login(page: Page, email: string, password: string) {
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
}

test('sin sesion, la app manda a login', async ({ page }) => {
  await mockGateway(page)
  await page.goto('/mis-pedidos')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
})

test('clave incorrecta muestra el aviso y no entra', async ({ page }) => {
  await mockGateway(page)
  await page.goto('/login')
  await login(page, customer.email, 'clave-mala')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('el cliente entra al catalogo y en Pedidos ve su pedido', async ({ page }) => {
  currentUser = customer
  await mockGateway(page)
  await page.goto('/login')
  await login(page, customer.email, 'cliente-password')
  await expect(page).toHaveURL(/\/mis-pedidos$/)
  // La pantalla arranca en la pestana Catalogo; los pedidos estan en la pestana Pedidos.
  await expect(page.getByText('Explorar Catálogo')).toBeVisible()
  await page.getByLabel('Pedidos', { exact: true }).click()
  // La direccion aparece en la tarjeta del pedido actual y en el historial: basta con que se vea.
  await expect(page.getByText('Av. Amazonas 100').first()).toBeVisible()
})

test('el repartidor entra y ve su ruta con la parada activa', async ({ page }) => {
  currentUser = driver
  await mockGateway(page)
  await page.goto('/login')
  await login(page, driver.email, 'repartidor-password')
  await expect(page).toHaveURL(/\/ruta$/)
  await expect(page.getByText('Calle Larga 5')).toBeVisible()
})

test('el repartidor cierra turno y vuelve a login', async ({ page }) => {
  currentUser = driver
  await mockGateway(page)
  await page.goto('/login')
  await login(page, driver.email, 'repartidor-password')
  await expect(page).toHaveURL(/\/ruta$/)
  await page.getByRole('button', { name: 'Cerrar turno' }).click()
  await page.getByText('Confirmar y cerrar sesión').click()
  await expect(page).toHaveURL(/\/login$/)
})

test.describe('registro de entrega del repartidor', () => {
  // La app envia la ubicacion del repartidor con el resultado: se concede GPS simulado.
  test.use({ geolocation: { latitude: -0.18, longitude: -78.48 }, permissions: ['geolocation'] })

  test('marcar una parada como entregada la mueve a Completados', async ({ page }) => {
    currentUser = driver
    let delivered = false
    let resultBody: unknown = null
    await mockGateway(page)
    // El mock de la ruta refleja el estado: tras registrar el resultado, la parada ya esta entregada.
    await page.route('**/api/v1/drivers/me/route', (route) =>
      route.fulfill({
        json: { ...driverRoute, stops: [{ ...driverRoute.stops[0], status: delivered ? 'DELIVERED' : 'PENDING' }] },
      }),
    )
    await page.route('**/api/v1/drivers/me/routes/route-1/stops/stop-1/result', async (route) => {
      resultBody = route.request().postDataJSON()
      delivered = true
      await route.fulfill({
        json: { ...driverRoute.stops[0], status: 'DELIVERED', reason: null },
      })
    })

    await page.goto('/login')
    await login(page, driver.email, 'repartidor-password')
    await expect(page.getByText('Calle Larga 5')).toBeVisible()
    await page.getByRole('button', { name: 'Entregado', exact: true }).click()

    await expect.poll(() => resultBody).toMatchObject({ outcome: 'DELIVERED' })
    await page.getByRole('tab', { name: /Completados/ }).click()
    await expect(page.getByText('Calle Larga 5')).toBeVisible()
  })
})
