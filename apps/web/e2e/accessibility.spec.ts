import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { loginAsAdmin, mockAuth } from './support'

/**
 * Revisión básica de accesibilidad (Sprint 6): axe sobre las pantallas de planificación.
 * Solo fallan los problemas de impacto serio o crítico; los menores quedan como deuda visible.
 */

const emptyJson = { status: 200, json: [] }

async function mockPlanning(page: Parameters<typeof mockAuth>[0]) {
  await mockAuth(page)
  await page.route('**/api/v1/drivers', (route) => route.fulfill(emptyJson))
  await page.route('**/api/v1/tracking/routes/active', (route) => route.fulfill(emptyJson))
  // Seguimiento y Rutas piden los pedidos para ubicar las paradas en el mapa.
  await page.route('**/api/v1/orders', (route) => route.fulfill(emptyJson))
}

async function seriousViolations(page: Parameters<typeof mockAuth>[0]) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
}

test('repartidores no tiene problemas serios de accesibilidad', async ({ page }) => {
  await mockPlanning(page)
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Repartidores', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Repartidores', exact: true })).toBeVisible()

  expect(await seriousViolations(page)).toEqual([])
})

test('seguimiento no tiene problemas serios de accesibilidad', async ({ page }) => {
  await mockPlanning(page)
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Seguimiento', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seguimiento', exact: true })).toBeVisible()

  expect(await seriousViolations(page)).toEqual([])
})

test('rutas no tiene problemas serios de accesibilidad', async ({ page }) => {
  await mockPlanning(page)
  await page.route('**/api/v1/orders', (route) =>
    route.fulfill({
      json: [{
        id: 'n-1', address: 'Calle Nueva 1', latitude: -0.18, longitude: -78.47, deliveryDate: '2026-11-18',
        windowStart: '09:00', windowEnd: '18:00', status: 'PENDING', reviewReasons: [], createdAt: '2026-11-18T12:00:00Z',
      }],
    }),
  )
  await page.route('**/api/v1/routes/plan', (route) =>
    route.fulfill({ json: { dryRun: true, planId: 'plan-1', routes: [], unassignedOrderIds: [] } }),
  )
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Rutas', exact: true }).click()
  await page.getByRole('button', { name: /Crear rutas/ }).click()
  await expect(page.getByText('No hay pedidos pendientes que armar para esta fecha.')).toBeVisible()

  expect(await seriousViolations(page)).toEqual([])
})
