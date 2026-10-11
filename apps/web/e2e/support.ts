import { expect, type Page } from '@playwright/test'

/**
 * Utilidades compartidas por las pruebas E2E. El API Gateway y los servicios
 * externos (Photon, teselas de OpenStreetMap) se simulan con page.route, así las
 * pruebas son deterministas y no dependen de red ni de los contenedores.
 */

export const admin = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@example.com',
  fullName: 'Ana Admin',
  role: 'ADMIN',
  active: true,
  createdAt: '2026-10-03T00:00:00Z',
}

/** Lugar que Photon devuelve para cualquier búsqueda o clic en el mapa. */
export const photonFeature = {
  geometry: { type: 'Point', coordinates: [-78.5, -0.2] },
  properties: { name: 'Av. Central', street: 'Av. Central', housenumber: '123', city: 'Quito', country: 'Ecuador' },
}

/** Gateway simulado: login, perfil, readiness y una pantalla base sin errores de red. */
export async function mockAuth(page: Page) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ json: { accessToken: 'tok', tokenType: 'Bearer', expiresIn: 3600, user: admin } }),
  )
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: admin }))
  await page.route('**/ready', (route) => route.fulfill({ json: { status: 'ready' } }))
}

/** Photon público: geocodificación inversa y búsqueda, siempre con el mismo lugar. */
export async function mockPhoton(page: Page) {
  await page.route('**/photon.komoot.io/**', (route) => route.fulfill({ json: { features: [photonFeature] } }))
}

/** Las teselas no son parte de lo que se prueba; se cortan para no depender de la red. */
export async function blockTiles(page: Page) {
  await page.route('**/tile.openstreetmap.org/**', (route) => route.abort())
}

/** Inicia sesión por la interfaz real y deja la aplicación en la página de inicio. */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/^Correo/).fill(admin.email)
  await page.getByLabel('Contraseña', { exact: true }).fill('admin-password')
  await page.getByRole('button', { name: 'Iniciar Sesión en Pikka' }).click()
  await expect(page.getByRole('link', { name: 'Pedidos' })).toBeVisible()
}

/** Hace clic en el mapa Leaflet en una posición relativa al contenedor. */
export async function clickMap(page: Page, x: number, y: number) {
  const map = page.locator('.leaflet-container').first()
  await expect(map).toBeVisible()
  await map.click({ position: { x, y } })
}
