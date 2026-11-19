import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { apiError, mockApi, renderApp } from '@/test/utils'

const SECTION_NAME = 'Catálogo'

const products = [
  { id: 'p1', name: 'Ramo de Rosas', description: 'Descripción del ramo de rosas.', unitPrice: '3.50', stockQuantity: 0 },
  { id: 'p2', name: 'Caja de Chocolates', unitPrice: '12' },
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

function slides(region: HTMLElement) {
  return within(region)
    .getAllByRole('group')
    .filter((g) => g.getAttribute('aria-roledescription') === 'slide')
}

describe('catálogo de la landing', () => {
  it('renderiza los productos de la respuesta del catálogo público', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    const cards = slides(await catalogRegion())
    expect(cards).toHaveLength(2)
    expect(within(cards[0] as HTMLElement).getByRole('heading', { name: 'Ramo de Rosas' })).toBeInTheDocument()
    expect(within(cards[0] as HTMLElement).getByText('Descripción del ramo de rosas.')).toBeInTheDocument()
    expect(within(cards[1] as HTMLElement).getByText(usd.format(12))).toBeInTheDocument()
  })

  it('cada producto tiene un botón Hacer pedido que lleva al registro', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    const buttons = within(await catalogRegion()).getAllByRole('link', { name: 'Hacer pedido' })
    expect(buttons).toHaveLength(2)
    for (const button of buttons) expect(button).toHaveAttribute('href', '/login?modo=registro')
  })

  it('no muestra stock, calificaciones, tiempos ni agregar al carrito', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    const region = await catalogRegion()
    expect(within(region).queryByText(/stock|existencia|unidades|Agregar/i)).not.toBeInTheDocument()
    expect(within(region).queryByText(/MIN|★|\bPK-/)).not.toBeInTheDocument()
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

  it('no envía la sesión en la petición pública del catálogo', async () => {
    useSession.getState().setToken('tok')
    const fetchMock = mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    await catalogRegion()
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string> | undefined
    expect(headers?.Authorization).toBeUndefined()
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/catalog\/products$/)
  })

  it('oculta la sección cuando el catálogo no tiene productos', async () => {
    mockApi(() => ({ status: 200, body: { products: [] } }))
    renderApp('/inicio')
    await waitFor(() => {
      expect(screen.queryByTestId('products-skeleton')).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('heading', { name: SECTION_NAME })).not.toBeInTheDocument()
  })

  it('el buscador filtra los productos por nombre al cargar el catálogo', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    await catalogRegion()
    const user = userEvent.setup()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar productos' }), 'chocolates{Enter}')
    const remaining = slides(await catalogRegion())
    expect(remaining).toHaveLength(1)
    expect(within(remaining[0] as HTMLElement).getByRole('heading', { name: 'Caja de Chocolates' })).toBeInTheDocument()
  })

  it('el filtro ignora mayúsculas y acentos', async () => {
    mockApi(() => ({ status: 200, body: { products: [{ id: 'p3', name: 'Galletas Árabes', unitPrice: '2' }, products[1]] } }))
    renderApp('/inicio')
    await catalogRegion()
    const user = userEvent.setup()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar productos' }), 'arabes{Enter}')
    const remaining = slides(await catalogRegion())
    expect(remaining).toHaveLength(1)
    expect(within(remaining[0] as HTMLElement).getByRole('heading', { name: 'Galletas Árabes' })).toBeInTheDocument()
  })

  it('si ningún producto coincide lo dice y ofrece quitar el filtro', async () => {
    mockApi(() => ({ status: 200, body: { products } }))
    renderApp('/inicio')
    await catalogRegion()
    const user = userEvent.setup()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar productos' }), 'zapatos{Enter}')
    expect(await screen.findByRole('status')).toHaveTextContent('Ningún producto coincide con “zapatos”.')
    await user.click(screen.getByRole('button', { name: 'Quitar filtro' }))
    expect(slides(await catalogRegion())).toHaveLength(2)
  })
})
