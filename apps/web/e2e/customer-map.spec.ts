import { expect, test, type Page } from '@playwright/test'
import { blockTiles, mockPhoton } from './support'

const customer = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'cliente@example.com',
  fullName: 'Carla Cliente',
  role: 'CUSTOMER',
  active: true,
  createdAt: '2026-10-03T00:00:00Z',
}

const water = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Agua 1L',
  description: 'Botella',
  unitPrice: '2.50',
  active: true,
  stockQuantity: 10,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

/** Zona grande alrededor de Quito: cualquier clic en el mapa por defecto cae dentro. */
const zone = {
  id: 'z-1',
  code: 'ZC-1',
  name: 'Zona Centro',
  ring: [
    { latitude: -0.05, longitude: -78.6 },
    { latitude: -0.05, longitude: -78.3 },
    { latitude: -0.35, longitude: -78.3 },
    { latitude: -0.35, longitude: -78.6 },
  ],
  holes: [],
}

/** Gateway simulado para el portal del cliente, con el mapa real de Leaflet. */
async function openNewOrderForm(page: Page) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ json: { accessToken: 'tok', tokenType: 'Bearer', expiresIn: 3600, user: customer } }),
  )
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: customer }))
  await page.route('**/ready', (route) => route.fulfill({ json: { status: 'ready' } }))
  await page.route('**/api/v1/orders/mine', (route) => route.fulfill({ json: { orders: [] } }))
  await page.route('**/api/v1/notifications/mine', (route) => route.fulfill({ json: { notifications: [] } }))
  await page.route('**/api/v1/products**', (route) => route.fulfill({ json: { products: [water] } }))
  await page.route('**/api/v1/coverage/zones', (route) => route.fulfill({ json: { zones: [zone] } }))
  await mockPhoton(page)
  await blockTiles(page)

  await page.goto('/login')
  await page.getByLabel(/^Correo/).fill(customer.email)
  await page.getByLabel('Contraseña', { exact: true }).fill('cliente-password')
  await page.getByRole('button', { name: 'Iniciar Sesión en Pikka' }).click()
  await page.getByRole('button', { name: 'Hacer nuevo pedido' }).click()
  const form = page.getByRole('dialog', { name: 'Hacer nuevo pedido' })
  await expect(form).toBeVisible()
  return form
}

test('el formulario de pedido amplía el mapa real y la selección se conserva al cerrar', async ({ page }) => {
  const form = await openNewOrderForm(page)
  const inline = form.locator('.leaflet-container').first()
  await expect(inline).toBeVisible()
  const inlineBox = await inline.boundingBox()

  await form.getByRole('button', { name: 'Ampliar mapa' }).click()

  const big = page.getByRole('dialog', { name: 'Mapa ampliado' })
  await expect(big).toBeVisible()
  const bigMap = big.locator('.leaflet-container')
  await expect(bigMap).toBeVisible()
  const bigBox = await bigMap.boundingBox()
  const viewport = page.viewportSize()
  expect(inlineBox).not.toBeNull()
  expect(bigBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  // Más grande que el del formulario, en ancho, y con el 70 % del alto de la ventana.
  expect(bigBox?.width ?? 0).toBeGreaterThan((inlineBox?.width ?? 0) + 100)
  expect(bigBox?.height ?? 0).toBeGreaterThan((viewport?.height ?? 0) * 0.6)
  // Es el mismo mapa: dibuja las zonas de cobertura.
  await expect(big.locator('.leaflet-overlay-pane path').first()).toBeAttached()

  await bigMap.click({ position: { x: 300, y: 250 } })
  await expect(big.getByText(/^-?\d+\.\d{5}, -?\d+\.\d{5}$/)).toBeVisible()

  await big.getByRole('button', { name: 'Listo' }).click()
  await expect(big).toBeHidden()
  await expect(form.getByLabel('Nombre del lugar')).toBeVisible()
  await expect(form.getByText(/Dentro de la zona «Zona Centro»/)).toBeVisible()
})

test('Escape cierra el mapa ampliado sin cerrar el formulario de pedido', async ({ page }) => {
  const form = await openNewOrderForm(page)
  await form.getByRole('button', { name: 'Ampliar mapa' }).click()
  const big = page.getByRole('dialog', { name: 'Mapa ampliado' })
  await expect(big).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(big).toBeHidden()
  await expect(form).toBeVisible()
})
