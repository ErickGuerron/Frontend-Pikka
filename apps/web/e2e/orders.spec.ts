import { expect, test, type Page } from '@playwright/test'
import { blockTiles, clickMap, loginAsAdmin, mockAuth, mockPhoton } from './support'

/** Gateway simulado para pedidos: guarda lo que llega por POST y lo devuelve en el listado. */
async function mockOrdersApi(page: Page) {
  const orders: unknown[] = []
  const received: unknown[] = []
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'POST') {
      const body: unknown = route.request().postDataJSON()
      received.push(body)
      const fields = typeof body === 'object' && body !== null ? body : {}
      const created = { ...fields, id: `o-${String(orders.length + 1)}`, status: 'PENDING', createdAt: '2026-10-10T12:00:00Z' }
      orders.push(created)
      await route.fulfill({ status: 201, json: created })
      return
    }
    await route.fulfill({ json: orders })
  })
  return received
}

async function setUpOrdersPage(page: Page) {
  await mockAuth(page)
  await mockPhoton(page)
  await blockTiles(page)
  const received = await mockOrdersApi(page)
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Pedidos' }).click()
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible()
  return received
}

test('registra un pedido con su ubicación del mapa y lo ve en el listado', async ({ page }) => {
  const received = await setUpOrdersPage(page)
  await expect(page.getByText('Aún no hay pedidos registrados')).toBeVisible()

  await page.getByRole('button', { name: 'Nuevo pedido' }).click()
  await clickMap(page, 200, 150)

  // La coordenada que se muestra en pantalla es la que debe viajar al backend.
  const shown = page.getByText(/^-?\d+\.\d{5}, -?\d+\.\d{5}$/)
  await expect(shown).toBeVisible()
  const [latText, lngText] = (await shown.textContent() ?? '').split(', ')

  await page.getByLabel(/Dirección de entrega/).fill('Av. Central 123, Col. Centro')
  await page.getByLabel(/Fecha de entrega/).fill('2099-12-31')
  await page.getByLabel('Desde').fill('09:00')
  await page.getByLabel('Hasta').fill('11:00')
  await page.getByRole('button', { name: 'Registrar pedido' }).click()

  await expect(page.getByRole('status')).toContainText('Pedido registrado para el')
  await expect(page.getByRole('cell', { name: 'Av. Central 123, Col. Centro' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '09:00–11:00' })).toBeVisible()

  expect(received).toHaveLength(1)
  const body = received[0] as { latitude: number; longitude: number; address: string }
  expect(body.address).toBe('Av. Central 123, Col. Centro')
  expect(body.latitude.toFixed(5)).toBe(latText)
  expect(body.longitude.toFixed(5)).toBe(lngText)
})

test('no permite registrar un pedido sin elegir la ubicación en el mapa', async ({ page }) => {
  const received = await setUpOrdersPage(page)

  await page.getByRole('button', { name: 'Nuevo pedido' }).click()
  await page.getByLabel(/Dirección de entrega/).fill('Av. Central 123, Col. Centro')
  await page.getByLabel(/Fecha de entrega/).fill('2099-12-31')
  await page.getByLabel('Desde').fill('09:00')
  await page.getByLabel('Hasta').fill('11:00')
  await page.getByRole('button', { name: 'Registrar pedido' }).click()

  await expect(page.getByText('Elige la ubicación de entrega en el mapa.')).toBeVisible()
  expect(received).toHaveLength(0)
})
