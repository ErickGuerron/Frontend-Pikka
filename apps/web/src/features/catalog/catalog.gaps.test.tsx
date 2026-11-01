import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { ApiError, userMessage } from '@/shared/api/errors'
import { adminUser, apiError, customerUser, mockApi, renderApp, sentBody } from '@/test/utils'
import { submitStockDelta } from './catalog.test-utils'

// El diálogo real de pedidos tiene su propio flujo (cubierto en customer-orders): aquí solo se observan sus callbacks.
vi.mock('@/features/customer-orders/NewOrderDialog', () => ({
  NewOrderDialog: ({ initialProductId, onClose, onCreated }: {
    initialProductId: string
    onClose: () => void
    onCreated: (order: { id: string }) => void
  }) => (
    <div role="dialog" aria-label="Pedido de prueba" data-product={initialProductId}>
      <button type="button" onClick={onClose}>Cerrar pedido de prueba</button>
      <button type="button" onClick={() => { onCreated({ id: 'abcdef1234567890' }) }}>Confirmar pedido de prueba</button>
    </div>
  ),
}))

const water = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Agua 1L',
  description: 'Botella de agua mineral',
  unitPrice: '2.50',
  active: true,
  stockQuantity: 10,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}
/** Lista de productos, con o sin ?includeInactive; no coincide con las rutas de un producto concreto. */
const PRODUCTS_URL = /\/api\/v1\/products(\?[^/]*)?$/

const juice = { ...water, id: '55555555-5555-5555-5555-555555555555', name: 'Jugo de naranja', description: undefined, stockQuantity: 0 }

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('catálogo del cliente: búsqueda, reintento y pedido', () => {
  function serveCatalog(replies: Array<{ status: number; body: unknown }>) {
    let call = 0
    return mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: customerUser }
      if (url.endsWith('/api/v1/products')) {
        call += 1
        return replies[Math.min(call - 1, replies.length - 1)] ?? { status: 200, body: { products: [] } }
      }
      return { status: 200, body: {} }
    })
  }

  it('el botón Limpiar búsqueda borra el texto y vuelve a mostrar todos los productos', async () => {
    serveCatalog([{ status: 200, body: { products: [water, juice] } }])
    renderApp('/catalogo')
    const user = userEvent.setup()
    const search = await screen.findByRole('searchbox', { name: 'Buscar productos' })

    await user.type(search, 'agua')
    expect(screen.queryByRole('heading', { name: 'Jugo de naranja' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))

    expect(search).toHaveValue('')
    expect(screen.getByRole('heading', { name: 'Jugo de naranja' })).toBeInTheDocument()
  })

  it('si el catálogo no carga, el botón Reintentar vuelve a pedirlo', async () => {
    serveCatalog([apiError(500, 'INTERNAL'), { status: 200, body: { products: [water] } }])
    renderApp('/catalogo')
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el catálogo.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Agua 1L' })).toBeInTheDocument()
  })

  it('pedir un producto abre el diálogo con ese producto y su confirmación muestra el aviso, que se puede cerrar', async () => {
    serveCatalog([{ status: 200, body: { products: [water] } }])
    renderApp('/catalogo')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Realizar pedido de Agua 1L' }))
    const dialog = screen.getByRole('dialog', { name: 'Pedido de prueba' })
    expect(dialog).toHaveAttribute('data-product', water.id)

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar pedido de prueba' }))

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('¡Pedido #abcdef12 realizado con éxito!')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(within(notice).getByRole('link', { name: 'Ver en Mis Pedidos →' })).toHaveAttribute('href', '/mis-pedidos')
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('cerrar el diálogo de pedido sin confirmar no muestra aviso', async () => {
    serveCatalog([{ status: 200, body: { products: [water] } }])
    renderApp('/catalogo')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Realizar pedido de Agua 1L' }))
    await user.click(screen.getByRole('button', { name: 'Cerrar pedido de prueba' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('administración de productos', () => {
  it('si la lista no carga, Reintentar vuelve a pedirla', async () => {
    let calls = 0
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (PRODUCTS_URL.test(url)) {
        calls += 1
        return calls === 1 ? apiError(500, 'INTERNAL') : { status: 200, body: { products: [water] } }
      }
      return { status: 200, body: {} }
    })
    renderApp('/productos')
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los productos.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Agua 1L')).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})

describe('panel de stock', () => {
  function serveStock(adjust: { status: number; body: unknown }) {
    return mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (PRODUCTS_URL.test(url)) return { status: 200, body: { products: [juice] } }
      if (url.endsWith('/stock-movements')) return { status: 200, body: [] }
      if (url.endsWith('/stock-adjustments') && init.method === 'POST') return adjust
      return { status: 200, body: {} }
    })
  }

  it('el motivo se escribe en el formulario de ajuste', async () => {
    serveStock({ status: 201, body: {} })
    renderApp('/productos')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Agregar stock de Jugo de naranja' }))
    const reason = screen.getByLabelText('Motivo (opcional)')
    await user.type(reason, 'Reposición')

    expect(reason).toHaveValue('Reposición')
  })

  it('un error distinto de 422 muestra el mensaje general de la API', async () => {
    serveStock(apiError(500, 'INTERNAL'))
    renderApp('/productos')
    const user = userEvent.setup()

    await submitStockDelta(user, '5')

    // El mismo mensaje puede aparecer también en otra parte de la pantalla: basta con que esté presente.
    const message = userMessage(new ApiError(500, 'INTERNAL', 'fallo'))
    await waitFor(() => { expect(screen.getAllByText(message).length).toBeGreaterThan(0) })
  })

  it('si el backend rechaza un ajuste que dejaría el stock en negativo, lo explica', async () => {
    const fetchMock = serveStock(apiError(422, 'VALIDATION'))
    renderApp('/productos')
    const user = userEvent.setup()

    await submitStockDelta(user, '5')

    expect(await screen.findByText('El ajuste dejaría el stock en negativo. Revisa la cantidad.')).toBeInTheDocument()
    const post = fetchMock.mock.calls.find(([u, i]) => u.endsWith('/stock-adjustments') && i?.method === 'POST')
    expect(sentBody(post?.[1])).toEqual({ type: 'RESTOCK', delta: 5 })
  })
})
