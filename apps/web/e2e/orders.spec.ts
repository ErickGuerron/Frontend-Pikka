import { expect, test, type Page } from '@playwright/test'
import { loginAsAdmin, mockAuth } from './support'

const inReview = {
  id: 'o-1',
  address: 'Plaza Foch, Quito',
  latitude: -0.2,
  longitude: -78.5,
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '11:00',
  status: 'PENDING_REVIEW',
  reviewReasons: ['CUSTOMER_BLOCKED'],
  createdAt: '2026-10-10T12:00:00Z',
  addressReference: 'Edificio azul, piso 3',
  contactPhone: '0991112233',
}

/** Gateway simulado: devuelve `orders` y, al decidir sobre uno, lo pasa a PENDING. Guarda las decisiones. */
async function setUpOrdersPage(page: Page, orders: unknown[]) {
  await mockAuth(page)
  let current = orders
  const decisions: unknown[] = []
  await page.route('**/api/v1/orders', (route) => route.fulfill({ json: current }))
  await page.route('**/api/v1/orders/*/review', async (route) => {
    decisions.push(route.request().postDataJSON())
    current = current.map((order) => ({ ...(order as object), status: 'PENDING', reviewReasons: [] }))
    await route.fulfill({ json: current[0] })
  })
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Pedidos' }).click()
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible()
  return decisions
}

test('el personal no registra pedidos: no hay botón para crearlos', async ({ page }) => {
  await setUpOrdersPage(page, [])

  await expect(page.getByText('Aún no hay pedidos registrados')).toBeVisible()
  await expect(page.getByRole('button', { name: /nuevo pedido|registrar/i })).toHaveCount(0)
})

test('aprueba un pedido en revisión desde el modal y el listado se actualiza', async ({ page }) => {
  const decisions = await setUpOrdersPage(page, [inReview])
  await expect(page.getByRole('cell', { name: 'Plaza Foch, Quito' })).toBeVisible()

  await page.getByRole('button', { name: 'Revisar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Cliente bloqueado')).toBeVisible()
  await expect(dialog.getByText(/Edificio azul, piso 3/)).toBeVisible()

  await dialog.getByLabel('Motivo *').fill('Cliente conocido, se acepta')
  await dialog.getByRole('button', { name: 'Guardar decisión' }).click()

  await expect(page.getByRole('status')).toContainText('Pedido confirmado.')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Revisar' })).toHaveCount(0)
  expect(decisions).toEqual([{ action: 'CONFIRM', reason: 'Cliente conocido, se acepta' }])
})

test('el modal de revisión se cierra con Escape sin enviar nada', async ({ page }) => {
  const decisions = await setUpOrdersPage(page, [inReview])

  await page.getByRole('button', { name: 'Revisar' }).click()
  await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(decisions).toHaveLength(0)
})
