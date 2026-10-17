import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { createOrder, listProducts } from '../src/features/customer-orders/api'
import { NewOrderForm } from '../src/features/customer-orders/NewOrderForm'
import { useOrdersStore } from '../src/features/customer-orders/orders-store'
import { formatCents, maxQuantity, parseProducts, priceLines, totalCents } from '../src/features/customer-orders/products'

// El mapa real es un WebView/iframe con Leaflet (lo cubren sus propias pruebas): aquí un botón emite un punto.
jest.mock('../src/features/customer-orders/map/LeafletMap', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  return {
    LeafletMap: ({ onPick }: { onPick: (c: { latitude: number; longitude: number }) => void }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: 'button', accessibilityLabel: 'Elegir punto en mapa', onPress: () => { onPick({ latitude: -0.2, longitude: -78.5 }) } },
        React.createElement(Text, null, 'Elegir punto'),
      ),
  }
})

const products = [
  { id: 'p1', name: 'Agua 20 L', unitPrice: '3.50', active: true, stockQuantity: null },
  { id: 'p2', name: 'Agua 5 L', unitPrice: '1.25', active: true, stockQuantity: 2 },
  { id: 'p3', name: 'Hielo', unitPrice: '2.00', active: true, stockQuantity: 0 },
  { id: 'p4', name: 'Retirado', unitPrice: '9.99', active: false, stockQuantity: null },
]
const created = {
  id: 'o1', address: 'Av. Amazonas 123', deliveryDate: '2026-12-31', windowStart: '09:00', windowEnd: '12:00',
  status: 'PENDING', reviewReasons: [], createdAt: '2026-01-01T00:00:00Z',
}

function mockGateway() {
  const fn = jest.fn((url: string, init: { method: string }) => {
    let body: unknown = { orders: [] }
    if (url.endsWith('/api/v1/products')) body = { products }
    else if (url.endsWith('/api/v1/orders') && init.method === 'POST') body = created
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) })
  })
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

const posts = (fn: jest.Mock) => fn.mock.calls.filter((call) => (call[1] as { method: string }).method === 'POST')

describe('products', () => {
  it('parses null stock as untracked and caps quantity by stock', () => {
    const [open, limited, soldOut] = parseProducts({ products })
    expect(open?.stockQuantity).toBeUndefined()
    expect(maxQuantity(open!)).toBe(50)
    expect(maxQuantity(limited!)).toBe(2)
    expect(maxQuantity(soldOut!)).toBe(0)
    expect(() => parseProducts({})).toThrow()
  })

  it('totals in integer cents', () => {
    const catalog = parseProducts({ products })
    const lines = priceLines([{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 3 }], catalog)
    expect(totalCents(lines)).toBe(1075)
    expect(formatCents(1075)).toBe('$10.75')
  })

  it('lists only active products from GET /api/v1/products', async () => {
    const fn = mockGateway()
    const list = await listProducts()
    expect(list.map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
    expect(String(fn.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/products$/)
  })
})

describe('createOrder request body', () => {
  const base = {
    address: 'Av. Amazonas 123', addressReference: 'Casa azul', contactPhone: '0991234567',
    deliveryDate: '2026-12-31', windowStart: '09:00', windowEnd: '12:00', items: [{ productId: 'p1', quantity: 2 }], notes: 'ignored',
  }

  it('sends items and contact fields, omits notes and an empty postal code', async () => {
    const fn = mockGateway()
    await createOrder({ ...base, postalCode: '' })
    const [, init] = posts(fn)[0] as [string, { body: string }]
    expect(JSON.parse(init.body)).toEqual({
      address: base.address, addressReference: 'Casa azul', contactPhone: '0991234567',
      deliveryDate: '2026-12-31', windowStart: '09:00', windowEnd: '12:00', items: base.items,
    })
  })

  it('sends the real coordinates of the map point when there is one, and nothing when there is not', async () => {
    const fn = mockGateway()
    await createOrder({ ...base, location: { latitude: -0.2, longitude: -78.5 } })
    await createOrder({ ...base })
    const [withPoint, withoutPoint] = posts(fn).map((call) => JSON.parse((call[1] as { body: string }).body) as Record<string, unknown>)
    expect(withPoint).toMatchObject({ latitude: -0.2, longitude: -78.5 })
    expect(withoutPoint).not.toHaveProperty('latitude')
    expect(withoutPoint).not.toHaveProperty('longitude')
    expect(withoutPoint).not.toHaveProperty('location')
  })

  it('sends the postal code when given', async () => {
    const fn = mockGateway()
    await createOrder({ ...base, postalCode: '170150' })
    const [, init] = posts(fn)[0] as [string, { body: string }]
    expect(JSON.parse(init.body)).toMatchObject({ postalCode: '170150' })
  })
})

describe('NewOrderForm', () => {
  beforeEach(() => {
    useOrdersStore.getState().reset()
  })

  async function fillValid() {
    await screen.findByText('Agua 20 L')
    await fireEvent.press(screen.getByLabelText('Agregar una unidad de Agua 20 L'))
    await fireEvent.press(screen.getByLabelText('Agregar una unidad de Agua 20 L'))
    await fireEvent.changeText(screen.getByLabelText('Dirección de entrega'), 'Av. Amazonas 123')
    await fireEvent.changeText(screen.getByLabelText('Referencia del lugar'), ' Casa azul ')
    await fireEvent.changeText(screen.getByLabelText('Teléfono de contacto'), '099-123-4567')
    await fireEvent.changeText(screen.getByLabelText('Fecha de entrega (AAAA-MM-DD)'), '2999-12-31')
    await fireEvent.press(screen.getByLabelText('Ventana 09–12'))
  }

  it('shows inline errors and sends nothing when the form is invalid', async () => {
    const fn = mockGateway()
    await render(<NewOrderForm onCreated={jest.fn()} />)
    await screen.findByText('Agua 20 L')
    await fireEvent.press(screen.getByLabelText('Revisar pedido'))
    expect(await screen.findByText('Elige al menos un producto.')).toBeTruthy()
    expect(screen.getByText(/Indica una referencia del lugar/)).toBeTruthy()
    expect(screen.getByText('Ingresa un teléfono de contacto.')).toBeTruthy()
    expect(posts(fn)).toHaveLength(0)
  })

  it('names every failing field in a "Falta un paso" alert and closes with Entendido', async () => {
    mockGateway()
    await render(<NewOrderForm onCreated={jest.fn()} />)
    await screen.findByText('Agua 20 L')
    await fireEvent.press(screen.getByLabelText('Revisar pedido'))

    expect(await screen.findByText('Falta un paso')).toBeTruthy()
    for (const field of ['Productos', 'Dirección de entrega', 'Referencia del lugar', 'Teléfono de contacto', 'Ventana de entrega']) {
      expect(screen.getAllByText(field).length).toBeGreaterThan(0)
    }

    await fireEvent.press(screen.getByLabelText('Entendido'))
    expect(screen.queryByText('Falta un paso')).toBeNull()
  })

  it('disables sold-out products and caps quantity by stock', async () => {
    mockGateway()
    await render(<NewOrderForm onCreated={jest.fn()} />)
    await screen.findByText('Agua 5 L')
    expect(screen.getByText('Agotado')).toBeTruthy()
    expect(screen.queryByText('Retirado')).toBeNull()
    await fireEvent.press(screen.getByLabelText('Agregar una unidad de Agua 5 L'))
    await fireEvent.press(screen.getByLabelText('Agregar una unidad de Agua 5 L'))
    await fireEvent.press(screen.getByLabelText('Agregar una unidad de Agua 5 L'))
    expect(screen.getByLabelText('Cantidad de Agua 5 L').props.children).toBe(2)
  })

  it('sends the point chosen on the map as real coordinates and shows it in the summary', async () => {
    const fn = mockGateway()
    const onCreated = jest.fn()
    await render(<NewOrderForm onCreated={onCreated} />)
    await fillValid()
    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))
    await fireEvent.press(screen.getByLabelText('Revisar pedido'))

    expect(await screen.findByText('Confirma tu pedido')).toBeTruthy()
    expect(screen.getByText('Punto en el mapa')).toBeTruthy()
    expect(screen.getByText('-0.20000, -78.50000')).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Confirmar pedido'))

    await waitFor(() => { expect(onCreated).toHaveBeenCalledTimes(1) })
    const [, init] = posts(fn)[0] as [string, { body: string }]
    expect(JSON.parse(init.body)).toMatchObject({ address: 'Av. Amazonas 123', latitude: -0.2, longitude: -78.5 })
  })

  it('shows the summary, can go back to edit, and only sends after confirming', async () => {
    const fn = mockGateway()
    const onCreated = jest.fn()
    await render(<NewOrderForm onCreated={onCreated} />)
    await fillValid()
    await fireEvent.press(screen.getByLabelText('Revisar pedido'))

    expect(await screen.findByText('Confirma tu pedido')).toBeTruthy()
    expect(screen.getByText('Av. Amazonas 123')).toBeTruthy()
    expect(screen.getByText('Casa azul')).toBeTruthy()
    expect(screen.getByText('No indicado')).toBeTruthy()
    expect(screen.getByText('0991234567')).toBeTruthy()
    expect(screen.getByText('2 × Agua 20 L')).toBeTruthy()
    expect(screen.getByText('Total estimado')).toBeTruthy()
    expect(screen.getAllByText('$7.00')).toHaveLength(2)
    expect(posts(fn)).toHaveLength(0)

    await fireEvent.press(screen.getByLabelText('Editar datos'))
    expect(await screen.findByLabelText('Referencia del lugar')).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Revisar pedido'))
    await fireEvent.press(await screen.findByLabelText('Confirmar pedido'))

    await waitFor(() => { expect(onCreated).toHaveBeenCalledTimes(1) })
    expect(posts(fn)).toHaveLength(1)
    const [, init] = posts(fn)[0] as [string, { body: string }]
    expect(JSON.parse(init.body)).toEqual({
      address: 'Av. Amazonas 123', addressReference: 'Casa azul', contactPhone: '0991234567',
      deliveryDate: '2999-12-31', windowStart: '09:00', windowEnd: '12:00', items: [{ productId: 'p1', quantity: 2 }],
    })
  })
})

describe('NewOrderForm with a product chosen in the catalog', () => {
  beforeEach(() => {
    useOrdersStore.getState().reset()
  })

  it('starts with that product selected, one unit', async () => {
    mockGateway()
    await render(<NewOrderForm initialProductId="p1" onCreated={jest.fn()} />)
    await screen.findByText('Agua 20 L')
    expect(screen.getByLabelText('Quitar una unidad de Agua 20 L')).toBeTruthy()
    expect(screen.queryByText('Sin productos elegidos')).toBeNull()
  })

  it('ignores an id that is not in the catalog', async () => {
    mockGateway()
    await render(<NewOrderForm initialProductId="nope" onCreated={jest.fn()} />)
    await screen.findByText('Agua 20 L')
    expect(screen.getByText('Sin productos elegidos')).toBeTruthy()
  })
})
