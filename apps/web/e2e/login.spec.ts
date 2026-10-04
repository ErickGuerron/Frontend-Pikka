import { expect, test, type Page } from '@playwright/test'

const admin = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@example.com',
  fullName: 'Ana Admin',
  role: 'ADMIN',
  active: true,
  createdAt: '2026-10-03T00:00:00Z',
}

async function mockGateway(page: Page) {
  await page.route('**/api/v1/auth/login', async (route) => {
    const body: unknown = route.request().postDataJSON()
    const ok = typeof body === 'object' && body !== null && 'password' in body && body.password === 'admin-password'
    await (ok
      ? route.fulfill({ json: { accessToken: 'tok', tokenType: 'Bearer', expiresIn: 3600, user: admin } })
      : route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'invalid credentials' } } }))
  })
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: admin }))
  await page.route('**/ready', (route) => route.fulfill({ json: { status: 'ready' } }))
}

test('login, navegación y cierre de sesión', async ({ page }) => {
  await mockGateway(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Correo').fill('admin@example.com')
  await page.getByLabel('Contraseña').fill('mala-clave')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos.')

  await page.getByLabel('Contraseña').fill('admin-password')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: 'Hola, Ana Admin' })).toBeVisible()
  await expect(page.getByTestId('system-status')).toHaveText('Backend disponible')

  await page.getByRole('link', { name: 'Rutas' }).click()
  await expect(page.getByRole('heading', { name: 'Rutas' })).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
