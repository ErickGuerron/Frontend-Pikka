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
