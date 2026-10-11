import { expect, test, type Page } from '@playwright/test'

const admin = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@example.com',
  fullName: 'Ana Admin',
  role: 'ADMIN',
  active: true,
  createdAt: '2026-10-03T00:00:00Z',
}

/** Gateway simulado: el backend de pedidos aún no expone el contrato orders.v1. */
async function mockGateway(page: Page) {
  const orders: unknown[] = []
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ json: { accessToken: 'tok', tokenType: 'Bearer', expiresIn: 3600, user: admin } }),
  )
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: admin }))
  await page.route('**/ready', (route) => route.fulfill({ json: { status: 'ready' } }))
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'POST') {
      const body: unknown = route.request().postDataJSON()
      const fields = typeof body === 'object' && body !== null ? body : {}
      const created = {
        ...fields,
        id: `o-${String(orders.length + 1)}`,
        status: 'PENDING',
        createdAt: '2026-10-10T12:00:00Z',
      }
      orders.push(created)
      await route.fulfill({ status: 201, json: created })
      return
    }
    await route.fulfill({ json: orders })
  })
}

test('registra un pedido y lo ve en el listado', async ({ page }) => {
  await mockGateway(page)
  await page.goto('/login')
  await page.getByLabel(/^Correo/).fill('admin@example.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('admin-password')
  await page.getByRole('button', { name: 'Iniciar Sesión en Pikka' }).click()

  await page.getByRole('link', { name: 'Pedidos' }).click()
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible()
  await expect(page.getByText('Aún no hay pedidos registrados')).toBeVisible()

  await page.getByRole('button', { name: 'Nuevo pedido' }).click()
  await page.getByLabel(/Dirección de entrega/).fill('Av. Central 123, Col. Centro')
  await page.getByLabel(/Fecha de entrega/).fill('2099-12-31')
  await page.getByLabel('Desde').fill('09:00')
  await page.getByLabel('Hasta').fill('11:00')
  await page.getByRole('button', { name: 'Registrar pedido' }).click()

  await expect(page.getByRole('status')).toContainText('Pedido registrado para el')
  await expect(page.getByRole('cell', { name: 'Av. Central 123, Col. Centro' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '09:00–11:00' })).toBeVisible()
})
