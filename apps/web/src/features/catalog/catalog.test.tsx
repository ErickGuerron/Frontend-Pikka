import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, customerUser, mockApi, renderApp, sentBody } from '@/test/utils'

const operatorUser = { ...adminUser, id: '66666666-6666-6666-6666-666666666666', role: 'OPERATOR' }

const water = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Agua 1L',
  description: 'Botella de vidrio',
  unitPrice: '2.50',
  active: true,
  stockQuantity: 10,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}
const juice = { ...water, id: '77777777-7777-7777-7777-777777777777', name: 'Jugo', unitPrice: '3.00', active: false, stockQuantity: undefined }

function serve(user: typeof adminUser, products = [water, juice], movements: unknown[] = []) {
  return mockApi((url, init) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: user }
    if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
    if (url.includes('/api/v1/products') && url.endsWith('/stock-movements')) return { status: 200, body: { movements } }
    if (url.includes('/api/v1/products') && url.endsWith('/stock-adjustments') && init.method === 'POST') {
      return { status: 201, body: { id: 'm1', productId: water.id, type: 'RESTOCK', delta: 5, resultingStock: 15, createdAt: '2026-10-02T00:00:00Z' } }
    }
    if (url.includes('/api/v1/products') && url.endsWith('/active') && init.method === 'PATCH') {
      return { status: 200, body: { ...water, active: false } }
    }
    if (url.includes('/api/v1/products') && init.method === 'POST') {
      return { status: 201, body: { ...water, id: 'new', name: 'Nuevo' } }
    }
    if (url.includes('/api/v1/products')) {
      const includeInactive = url.includes('includeInactive=true')
      return { status: 200, body: { products: includeInactive ? products : products.filter((p) => p.active) } }
    }
    return { status: 200, body: [] }
  })
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('catálogo del cliente', () => {
  it('muestra solo productos activos con nombre, descripción y precio, sin stock', async () => {
    serve(customerUser)
    renderApp('/catalogo')

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeInTheDocument()
    expect(await screen.findByText('Agua 1L')).toBeInTheDocument()
    expect(screen.getByText('Botella de vidrio')).toBeInTheDocument()
    expect(screen.getByText('$2.50')).toBeInTheDocument()
    expect(screen.queryByText('Jugo')).not.toBeInTheDocument()
    expect(screen.queryByText(/stock|unidades/i)).not.toBeInTheDocument()
  })

  it('el cliente no llega a la administración de productos', async () => {
    serve(customerUser)
    const { router } = renderApp('/productos')

    await waitFor(() => { expect(router.state.location.pathname).toBe('/mis-pedidos') })
  })
})

describe('administración de productos (personal)', () => {
  it('el operador ve también los productos inactivos y el stock de los que lo controlan', async () => {
    serve(operatorUser)
    renderApp('/productos')

    const table = await screen.findByRole('table', { name: 'Productos' })
    expect(within(table).getByText('Jugo')).toBeInTheDocument()
    expect(within(table).getByText('Inactivo')).toBeInTheDocument()
    expect(within(table).getByText('10')).toBeInTheDocument()
    expect(within(table).getByText('Sin control de stock')).toBeInTheDocument()
  })

  it('no envía el alta de producto con precio inválido y muestra el motivo', async () => {
    const fetchMock = serve(operatorUser)
    renderApp('/productos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Nuevo producto' }))
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo')
    await user.type(screen.getByLabelText('Precio (USD)'), '2.505')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    expect(await screen.findByText(/precio/i, { selector: '[role="alert"]' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('crea un producto con precio de texto y sin stock inicial cuando el campo está vacío', async () => {
    const fetchMock = serve(operatorUser)
    renderApp('/productos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Nuevo producto' }))
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo')
    await user.type(screen.getByLabelText('Precio (USD)'), '2.50')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
      expect(post).toBeDefined()
      expect(sentBody(post?.[1])).toEqual({ name: 'Nuevo', unitPrice: '2.50' })
    })
  })

  it('retira un producto activo con PATCH al contrato', async () => {
    const fetchMock = serve(operatorUser)
    renderApp('/productos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Desactivar Agua 1L' }))

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
      expect(sentBody(patch?.[1])).toEqual({ active: false })
    })
  })

  it('exige motivo para un ajuste manual antes de enviarlo', async () => {
    const fetchMock = serve(operatorUser)
    renderApp('/productos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Ajustar stock de Agua 1L' }))
    await user.selectOptions(screen.getByLabelText('Tipo de movimiento'), 'ADJUSTMENT')
    await user.type(screen.getByLabelText('Cantidad (+ suma, - resta)'), '-2')
    await user.click(screen.getByRole('button', { name: 'Registrar movimiento' }))

    expect(await screen.findByText('Indica el motivo del ajuste.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('registra una entrada (RESTOCK) y el historial muestra los movimientos', async () => {
    const fetchMock = serve(operatorUser, [water], [
      { id: 'm0', productId: water.id, type: 'SALE', delta: -1, resultingStock: 9, createdAt: '2026-10-01T10:00:00Z' },
    ])
    renderApp('/productos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Ajustar stock de Agua 1L' }))
    await user.type(screen.getByLabelText('Cantidad (+ suma, - resta)'), '5')
    await user.click(screen.getByRole('button', { name: 'Registrar movimiento' }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
      expect(sentBody(post?.[1])).toEqual({ type: 'RESTOCK', delta: 5 })
    })
    const history = await screen.findByRole('table', { name: 'Movimientos de Agua 1L' })
    expect(within(history).getByText('Venta')).toBeInTheDocument()
  })
})
