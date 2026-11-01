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

  it('el botón Realizar pedido abre el modal de nuevo pedido con el producto auto-seleccionado', async () => {
    serve(customerUser)
    renderApp('/catalogo')
    const user = userEvent.setup()

    const orderButton = await screen.findByRole('button', { name: 'Realizar pedido de Agua 1L' })
    expect(orderButton).toBeInTheDocument()

    await user.click(orderButton)

    expect(await screen.findByRole('heading', { name: 'Hacer nuevo pedido' })).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('el buscador filtra productos por texto y permite limpiar el filtro', async () => {
    serve(customerUser)
    renderApp('/catalogo')
    const user = userEvent.setup()

    expect(await screen.findByText('Agua 1L')).toBeInTheDocument()

    const searchInput = screen.getByLabelText('Buscar productos')
    await user.type(searchInput, 'Inexistente')

    expect(screen.getByText(/Ningún producto coincide con/)).toBeInTheDocument()
    expect(screen.queryByText('Agua 1L')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quitar filtro' }))
    expect(await screen.findByText('Agua 1L')).toBeInTheDocument()
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

describe('ajuste de stock en modal', () => {
  async function openStock() {
    serve(operatorUser)
    renderApp('/productos')
    const user = userEvent.setup()
    const trigger = await screen.findByRole('button', { name: 'Ajustar stock de Agua 1L' })
    await user.click(trigger)
    return { user, trigger }
  }

  it('se abre como diálogo modal, Escape lo cierra y devuelve el foco al botón', async () => {
    const { user, trigger } = await openStock()

    expect(screen.getByRole('dialog', { name: 'Stock de Agua 1L' })).toHaveAttribute('aria-modal', 'true')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('la cantidad admite signo y hasta 6 cifras, sin letras', async () => {
    const { user } = await openStock()
    const delta = screen.getByLabelText('Cantidad (+ suma, - resta)')

    await user.type(delta, '-a1b2')
    expect(delta).toHaveValue('-12')

    await user.clear(delta)
    await user.type(delta, '12345678')
    expect(delta).toHaveValue('123456')
  })
})

describe('producto sin stock', () => {
  it('ofrece "Agregar stock" cuando el stock es cero', async () => {
    serve(operatorUser, [{ ...water, stockQuantity: 0 }])
    renderApp('/productos')

    expect(await screen.findByRole('button', { name: 'Agregar stock de Agua 1L' })).toHaveTextContent('Agregar stock')
  })
})

describe('alta de producto en modal', () => {
  async function openModal() {
    const fetchMock = serve(operatorUser)
    renderApp('/productos')
    const user = userEvent.setup()
    const trigger = await screen.findByRole('button', { name: 'Nuevo producto' })
    await user.click(trigger)
    return { fetchMock, user, trigger }
  }

  const postCalls = (fetchMock: ReturnType<typeof serve>) =>
    fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')

  it('se abre desde "Nuevo producto" como diálogo con foco en el nombre', async () => {
    await openModal()

    const dialog = screen.getByRole('dialog', { name: 'Nuevo producto' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
  })

  it('Escape cierra y devuelve el foco al botón que lo abrió', async () => {
    const { user, trigger } = await openModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('Tab no sale del diálogo: desde el último control vuelve al primero', async () => {
    const { user } = await openModal()

    screen.getByRole('button', { name: 'Guardar producto' }).focus()
    await user.tab()

    expect(screen.getByLabelText('Nombre')).toHaveFocus()
  })

  it('valida nombre y precio, marca los campos y enlaza el mensaje, sin enviar', async () => {
    const { fetchMock, user } = await openModal()

    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    const name = screen.getByLabelText('Nombre')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Escribe el nombre del producto.')
    expect(screen.getByLabelText('Precio (USD)')).toHaveAttribute('aria-invalid', 'true')
    expect(postCalls(fetchMock)).toHaveLength(0)
  })

  it('no pide stock inicial si el producto no controla stock', async () => {
    const { fetchMock, user } = await openModal()

    expect(screen.queryByLabelText('Stock inicial')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo')
    await user.type(screen.getByLabelText('Precio (USD)'), '2.50')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    await waitFor(() => { expect(postCalls(fetchMock)).toHaveLength(1) })
    expect(sentBody(postCalls(fetchMock)[0]?.[1])).toEqual({ name: 'Nuevo', unitPrice: '2.50' })
  })

  it('con control de stock envía el stock inicial como entero', async () => {
    const { fetchMock, user } = await openModal()

    await user.type(screen.getByLabelText('Nombre'), 'Nuevo')
    await user.type(screen.getByLabelText('Precio (USD)'), '2.50')
    await user.click(screen.getByLabelText('Controla stock'))
    await user.type(screen.getByLabelText('Stock inicial'), '5')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    await waitFor(() => { expect(postCalls(fetchMock)).toHaveLength(1) })
    expect(sentBody(postCalls(fetchMock)[0]?.[1])).toEqual({ name: 'Nuevo', unitPrice: '2.50', initialStock: 5 })
  })

  it('el stock inicial descarta letras y signos y se limita a 6 cifras', async () => {
    const { user } = await openModal()

    await user.click(screen.getByLabelText('Controla stock'))
    const stock = screen.getByLabelText('Stock inicial')
    await user.type(stock, '-a1b2.3')
    expect(stock).toHaveValue('123')

    await user.clear(stock)
    await user.type(stock, '12345678')
    expect(stock).toHaveValue('123456')
  })

  it('nombre hasta 100 caracteres y descripción hasta 200', async () => {
    const { user } = await openModal()

    expect(screen.getByLabelText('Nombre')).toHaveAttribute('maxlength', '100')
    expect(screen.getByLabelText('Descripción (opcional)')).toHaveAttribute('maxlength', '200')
    await user.type(screen.getByLabelText('Nombre'), 'x'.repeat(120))
    expect(screen.getByLabelText('Nombre')).toHaveValue('x'.repeat(100))
  })

  it('al guardar invalida la lista, cierra el modal y confirma', async () => {
    const { fetchMock, user } = await openModal()

    await user.type(screen.getByLabelText('Nombre'), 'Nuevo')
    await user.type(screen.getByLabelText('Precio (USD)'), '2.50')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    expect(await screen.findByText('Producto «Nuevo» creado.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const listCalls = fetchMock.mock.calls.filter(([url, init]) => url.includes('includeInactive=true') && init?.method !== 'POST')
    expect(listCalls.length).toBeGreaterThanOrEqual(2)
  })
})
