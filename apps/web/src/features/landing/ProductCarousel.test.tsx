import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { apiError, mockApi, renderApp } from '@/test/utils'

const SECTION_NAME = 'Productos disponibles'

const products = [
  { id: 'p1', name: 'Producto A', description: 'Descripción del producto A.', unitPrice: '3.50', stockQuantity: 0 },
  { id: 'p2', name: 'Producto B', unitPrice: '12' },
]

const usd = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })

beforeEach(() => {
  useSession.getState().clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function catalogRegion() {
  return screen.findByRole('region', { name: SECTION_NAME }, { timeout: 4000 })
}

describe('carrusel de productos', () => {
  it('renderiza los productos de la respuesta del catálogo público', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    const region = await catalogRegion()
    const cards = within(region)
      .getAllByRole('group')
      .filter((g) => g.getAttribute('aria-roledescription') === 'slide')
    expect(cards).toHaveLength(2)
    expect(within(cards[0] as HTMLElement).getByRole('heading', { name: 'Producto A' })).toBeInTheDocument()
    expect(within(cards[0] as HTMLElement).getByText('Descripción del producto A.')).toBeInTheDocument()
    expect(within(cards[1] as HTMLElement).getByText(usd.format(12))).toBeInTheDocument()
  })

  it('muestra un esqueleto con aria-busy mientras carga', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    )
    renderApp('/inicio')
    expect(screen.getByTestId('products-skeleton')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando productos…')).toBeInTheDocument()
  })

  it('muestra un error con un botón para reintentar', async () => {
    let calls = 0
    mockApi(() => {
      calls += 1
      return calls === 1 ? apiError(503, 'UPSTREAM_UNAVAILABLE') : { status: 200, body: { products } }
    })
    renderApp('/inicio')
    const user = userEvent.setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los productos.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await catalogRegion()).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  it('no muestra stock ni existencias aunque la respuesta los incluya', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    const region = await catalogRegion()
    expect(within(region).queryByText(/stock|existencia|unidades/i)).not.toBeInTheDocument()
  })

  it('los botones anterior y siguiente tienen aria-label', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    const region = await catalogRegion()
    expect(within(region).getByRole('button', { name: 'Producto anterior' })).toBeInTheDocument()
    expect(within(region).getByRole('button', { name: 'Producto siguiente' })).toBeInTheDocument()
  })

  it('oculta la sección cuando el catálogo no tiene productos', async () => {
    mockApi(() => ({ status: 200, body: { products: [] } }))
    renderApp('/inicio')
    await waitFor(() => {
      expect(screen.queryByTestId('products-skeleton')).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('heading', { name: SECTION_NAME })).not.toBeInTheDocument()
  })

  it('no envía la sesión en la petición pública del catálogo', async () => {
    useSession.getState().setToken('tok')
    const fetchMock = mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    await catalogRegion()
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string> | undefined
    expect(headers?.Authorization).toBeUndefined()
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/catalog\/products$/)
  })
})
