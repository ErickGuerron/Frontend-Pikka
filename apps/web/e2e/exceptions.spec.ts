import { expect, test } from '@playwright/test'
import { loginAsAdmin, mockAuth } from './support'

const exception = {
  id: 'o-9',
  address: 'Av. Central 123, Col. Centro',
  latitude: -0.2,
  longitude: -78.5,
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '11:00',
  status: 'PENDING_REVIEW',
  reviewReasons: ['ZONE_NOT_COVERED'],
  createdAt: '2026-10-10T12:00:00Z',
}

test('el operador rechaza una excepción con motivo y sale de la cola', async ({ page }) => {
  await mockAuth(page)
  const queue = [exception]
  const decisions: unknown[] = []
  await page.route('**/api/v1/orders/exceptions', (route) => route.fulfill({ json: queue }))
  await page.route('**/api/v1/orders/*/review', async (route) => {
    decisions.push(route.request().postDataJSON())
    queue.splice(0, queue.length)
    await route.fulfill({ json: { ...exception, status: 'CANCELLED' } })
  })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Excepciones' }).click()
  await expect(page.getByRole('heading', { name: 'Excepciones', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Fuera de una zona atendida' })).toBeVisible()

  await page.getByRole('button', { name: 'Revisar' }).click()
  await page.getByLabel(/^Rechazar/).check()
  await page.getByLabel('Motivo *').fill('Dirección fuera del área de cobertura')
  await page.getByRole('button', { name: 'Guardar decisión' }).click()

  await expect(page.getByRole('status')).toContainText('Pedido rechazado.')
  await expect(page.getByText('No hay pedidos pendientes de revisión.')).toBeVisible()
  expect(decisions).toEqual([{ action: 'REJECT', reason: 'Dirección fuera del área de cobertura' }])
})
