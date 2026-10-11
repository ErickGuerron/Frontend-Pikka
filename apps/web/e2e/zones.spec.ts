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
    { latitude: -0.15, longitude: -78.55 },
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

test('dibuja una zona: un punto interior no cambia la forma, se quita con clic derecho y se guarda', async ({ page }) => {
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

  // Un punto dentro de la zona no cambia la forma y no se dibuja.
  await clickMap(page, 200, 150)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText(/Vértices: 4/)).toBeVisible()

  // Clic derecho sobre el último vértice lo quita; la forma pasa a triángulo y no se puede guardar.
  await clickMap(page, 100, 300, 'right')
  await expect(page.getByText(/Vértices: 3/)).toBeVisible()

  // Retroceso quita el último vértice visible (no mientras se escribe en un campo).
  // El punto interior se salta, así que la forma pasa de triángulo a otro triángulo.
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Backspace')
  await expect(page.getByText(/Vértices: 3/)).toBeVisible()

  // Se vuelve a marcar el cuadrado en el mismo orden.
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

test('quita un vértice intermedio y al volver a marcarlo la forma vuelve a cuatro vértices', async ({ page }) => {
  await mockAuth(page)
  await blockTiles(page)
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await page.getByRole('button', { name: 'Dibujar zona' }).click()

  await clickMap(page, 100, 100)
  await clickMap(page, 300, 100)
  await clickMap(page, 300, 300)
  await clickMap(page, 100, 300)
  await expect(page.getByText(/Vértices: 4/)).toBeVisible()

  // Clic derecho sobre la esquina intermedia (300, 100).
  await clickMap(page, 300, 100, 'right')
  await expect(page.getByText(/Vértices: 3/)).toBeVisible()

  // Al volver a marcar ese punto, la zona vuelve a formar el cuadrado, sin errores.
  await clickMap(page, 300, 100)
  await expect(page.getByText(/Vértices: 4/)).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Guardar zona' })).toBeDisabled()

  await page.getByLabel('Código').fill('CENTRO-2')
  await page.getByLabel('Nombre').fill('Zona Centro 2')
  await expect(page.getByRole('button', { name: 'Guardar zona' })).toBeEnabled()
})

test('busca una calle antes de dibujar: centra el mapa y no marca puntos', async ({ page }) => {
  await mockAuth(page)
  await mockPhoton(page)
  await blockTiles(page)
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await page.getByRole('button', { name: 'Dibujar zona' }).click()

  await page.getByLabel('Buscar calle o lugar').fill('Av. Central')
  await page.getByRole('button', { name: /Av\. Central/ }).click()

  await expect(page.getByText(/Vértices: 0/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar zona' })).toBeDisabled()
})

test('dibuja una zona con hueco (dona) y la guarda con el hueco incluido', async ({ page }) => {
  await mockAuth(page)
  await blockTiles(page)
  const created: unknown[] = []
  await page.route('**/api/v1/zones', async (route) => {
    if (route.request().method() === 'POST') {
      created.push(route.request().postDataJSON())
      await route.fulfill({ status: 201, json: { ...centro, id: '44444444-4444-4444-4444-444444444444', code: 'DONA', name: 'Dona Centro' } })
    }
  })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await page.getByRole('button', { name: 'Dibujar zona' }).click()

  // Exterior: cuadrado de 200 px.
  await clickMap(page, 100, 100)
  await clickMap(page, 300, 100)
  await clickMap(page, 300, 300)
  await clickMap(page, 100, 300)
  await expect(page.getByText(/Exterior · Vértices: 4/)).toBeVisible()

  // Hueco centrado, dentro del exterior.
  await page.getByRole('button', { name: 'Agregar hueco' }).click()
  await expect(page.getByText(/Hueco · Vértices: 0/)).toBeVisible()
  await clickMap(page, 150, 150)
  await clickMap(page, 250, 150)
  await clickMap(page, 250, 250)
  await clickMap(page, 150, 250)
  await expect(page.getByText(/Hueco · Vértices: 4/)).toBeVisible()
  await page.getByRole('button', { name: 'Terminar hueco' }).click()
  await expect(page.getByText(/Huecos: 1/)).toBeVisible()

  await page.getByLabel('Código').fill('DONA')
  await page.getByLabel('Nombre').fill('Dona Centro')
  await page.getByRole('button', { name: 'Guardar zona' }).click()

  await expect(page.getByRole('status')).toContainText('Zona DONA guardada.')
  expect(created).toHaveLength(1)
  const body = created[0] as { ring: unknown[]; holes: { latitude: number; longitude: number }[][] }
  expect(body.ring).toHaveLength(5)
  expect(body.holes).toHaveLength(1)
  expect(body.holes[0]).toHaveLength(5)
  expect(body.holes[0]?.[0]).toEqual(body.holes[0]?.[4])
})

test('no permite terminar un hueco que sale de la zona', async ({ page }) => {
  await mockAuth(page)
  await blockTiles(page)
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await page.getByRole('button', { name: 'Dibujar zona' }).click()

  await clickMap(page, 100, 100)
  await clickMap(page, 300, 100)
  await clickMap(page, 300, 300)
  await clickMap(page, 100, 300)
  await page.getByRole('button', { name: 'Agregar hueco' }).click()

  // Un cuadrado que se sale por la derecha de la zona.
  await clickMap(page, 250, 150)
  await clickMap(page, 380, 150)
  await clickMap(page, 380, 250)
  await clickMap(page, 250, 250)

  await expect(page.getByText(/completamente dentro de la zona/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Terminar hueco' })).toBeDisabled()
})

const dona = {
  id: '55555555-5555-5555-5555-555555555555',
  code: 'DONA',
  name: 'Dona Centro',
  ring: [
    { latitude: -0.25, longitude: -78.55 },
    { latitude: -0.25, longitude: -78.45 },
    { latitude: -0.15, longitude: -78.45 },
    { latitude: -0.15, longitude: -78.55 },
    { latitude: -0.25, longitude: -78.55 },
  ],
  holes: [
    [
      { latitude: -0.22, longitude: -78.52 },
      { latitude: -0.22, longitude: -78.48 },
      { latitude: -0.18, longitude: -78.48 },
      { latitude: -0.18, longitude: -78.52 },
      { latitude: -0.22, longitude: -78.52 },
    ],
  ],
  createdAt: '2026-10-03T00:00:00Z',
}

test('clasificar punto muestra el hueco de la zona', async ({ page }) => {
  await mockAuth(page)
  await mockPhoton(page)
  await blockTiles(page)
  await page.route('**/api/v1/zones/classify**', (route) => route.fulfill({ json: dona }))
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await clickMap(page, 200, 150)

  await expect(page.getByText('Zona Dona Centro (DONA).')).toBeVisible()
  await expect(page.locator('path[stroke="#b45309"]')).toHaveCount(1)
})

test('redibuja una zona registrada: la carga en el editor y guarda los cambios con PUT', async ({ page }) => {
  await mockAuth(page)
  await blockTiles(page)
  const updates: { url: string; body: unknown }[] = []
  await page.route('**/api/v1/zones', (route) => route.fulfill({ json: [dona] }))
  await page.route('**/api/v1/zones/*', async (route) => {
    if (route.request().method() === 'PUT') {
      updates.push({ url: route.request().url(), body: route.request().postDataJSON() })
      await route.fulfill({ json: { ...dona, name: 'Dona nueva' } })
    }
  })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Zonas' }).click()
  await page.getByRole('button', { name: 'Dibujar zona' }).click()
  await page.getByRole('button', { name: 'Redibujar DONA' }).click()

  await expect(page.getByText('Redibujando DONA')).toBeVisible()
  await expect(page.getByText(/Exterior · Vértices: 4/)).toBeVisible()
  await expect(page.getByText(/Huecos: 1/)).toBeVisible()
  await expect(page.getByLabel('Código')).toHaveValue('DONA')

  await page.getByLabel('Nombre').fill('Dona nueva')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(page.getByRole('status')).toContainText('Zona DONA actualizada.')
  expect(updates).toHaveLength(1)
  expect(updates[0]?.url).toMatch(/\/api\/v1\/zones\/55555555-5555-5555-5555-555555555555$/)
  const body = updates[0]?.body as { name: string; holes: unknown[] }
  expect(body.name).toBe('Dona nueva')
  expect(body.holes).toHaveLength(1)
})
