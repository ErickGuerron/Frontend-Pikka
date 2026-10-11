import { expect, test } from '@playwright/test'
import { blockTiles, clickMap, loginAsAdmin, mockAuth, mockPhoton } from './support'

const centro = {
  id: '22222222-2222-2222-2222-222222222222',
  code: 'CENTRO',
  name: 'Centro',
  ring: [
    { latitude: -0.25, longitude: -78.55 },
    { latitude: -0.25, longitude: -78.45 },
    { latitude: -0.15, longitude: -78.45 },
    { latitude: -0.25, longitude: -78.55 },
  ],
  createdAt: '2026-10-03T00:00:00Z',
}

test('clasifica el punto elegido en el mapa y muestra la zona que lo contiene', async ({ page }) => {
  await mockAuth(page)
  await mockPhoton(page)
  await blockTiles(page)
  const classified: string[] = []
  await page.route('**/api/v1/zones/classify**', (route) => {
    classified.push(route.request().url())
    return route.fulfill({ json: centro })
  })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await clickMap(page, 200, 150)

  await expect(page.getByText('Zona Centro (CENTRO).')).toBeVisible()
  expect(classified.length).toBeGreaterThan(0)
  expect(classified[0]).toMatch(/latitude=-?\d/)
  expect(classified[0]).toMatch(/longitude=-?\d/)
})

test('informa cuando ninguna zona cubre el punto elegido', async ({ page }) => {
  await mockAuth(page)
  await mockPhoton(page)
  await blockTiles(page)
  await page.route('**/api/v1/zones/classify**', (route) =>
    route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'zone not found' } } }),
  )
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await clickMap(page, 200, 150)

  await expect(page.getByText('Ninguna zona cubre este punto.')).toBeVisible()
})

test('dibuja una zona cuadrada, quita un vértice con clic derecho y la guarda', async ({ page }) => {
  await mockAuth(page)
  await blockTiles(page)
  const created: unknown[] = []
  await page.route('**/api/v1/zones', async (route) => {
    if (route.request().method() === 'POST') {
      created.push(route.request().postDataJSON())
      await route.fulfill({ status: 201, json: { ...centro, id: '33333333-3333-3333-3333-333333333333', code: 'NORTE', name: 'Zona Norte' } })
    }
  })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await page.getByRole('button', { name: 'Dibujar zona' }).click()

  // Cuatro esquinas de un cuadrado en la pantalla.
  await clickMap(page, 100, 100)
  await clickMap(page, 300, 100)
  await clickMap(page, 300, 300)
  await clickMap(page, 100, 300)
  await expect(page.getByText(/Vértices: 4/)).toBeVisible()

  // Un punto en el centro dejaría una muesca: el mapa lo rechaza y explica por qué.
  await clickMap(page, 200, 200)
  await expect(page.getByRole('alert')).toContainText('no convexa')
  await expect(page.getByText(/Vértices: 4/)).toBeVisible()

  // Clic derecho sobre el último vértice lo quita.
  await clickMap(page, 100, 300, 'right')
  await expect(page.getByText(/Vértices: 3/)).toBeVisible()

  // La tecla Retroceso también quita el último vértice (no mientras se escribe en un campo).
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Backspace')
  await expect(page.getByText(/Vértices: 2/)).toBeVisible()

  // Se vuelve a dibujar el cuadrado en el mismo orden: esquina, esquina, esquina, esquina.
  await page.getByLabel('Código').fill('NORTE')
  await page.getByLabel('Nombre').fill('Zona Norte')
  await expect(page.getByRole('button', { name: 'Guardar zona' })).toBeDisabled()
  await clickMap(page, 300, 300)
  await clickMap(page, 100, 300)
  await expect(page.getByText(/Vértices: 4/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar zona' })).toBeEnabled()
  await page.getByRole('button', { name: 'Guardar zona' }).click()

  await expect(page.getByRole('status')).toContainText('Zona NORTE guardada.')
  expect(created).toHaveLength(1)
  const body = created[0] as { ring: { latitude: number; longitude: number }[] }
  expect(body.ring).toHaveLength(5)
  expect(body.ring[0]).toEqual(body.ring[4])
})
