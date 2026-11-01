import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp } from '@/test/utils'
import type { Order } from './types'

// El mapa real necesita un navegador (lo cubre el e2e): aquí un nodo expone lo que recibiría.
vi.mock('@/features/geo/LazyMapCanvas', async () => {
  const { createElement } = await import('react')
  return {
    LazyMapCanvas: (props: {
      picked?: { latitude: number; longitude: number } | null
      highlight?: readonly unknown[] | null
      zones?: readonly unknown[]
    }) =>
      createElement('div', {
        'data-testid': 'order-map',
        'data-picked': props.picked ? `${String(props.picked.latitude)},${String(props.picked.longitude)}` : '',
        'data-highlight': String(props.highlight?.length ?? 0),
        'data-zones': String(props.zones?.length ?? 0),
      }),
  }
})

const pending: Order = {
  id: 'o-1',
  address: 'Vía Interoceánica, Guápulo, Quito',
  latitude: -0.189,
  longitude: -78.463,
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '12:00',
  status: 'PENDING',
  reviewReasons: [],
  createdAt: '2026-10-10T12:00:00Z',
  addressReference: 'Casa blanca, portón verde',
  postalCode: '170150',
  contactPhone: '0991112233',
}

const inReview: Order = {
  ...pending,
  id: 'o-7',
  address: 'Plaza Foch, Quito',
  status: 'PENDING_REVIEW',
  reviewReasons: ['CUSTOMER_BLOCKED'],
}

/** Cuadrado que contiene a `pending`. */
const centro = {
  id: 'z-1',
  code: 'ZC-1',
  name: 'Zona Centro',
  ring: [
    { latitude: -0.1, longitude: -78.6 },
    { latitude: -0.1, longitude: -78.4 },
    { latitude: -0.3, longitude: -78.4 },
    { latitude: -0.3, longitude: -78.6 },
  ],
  holes: [],
}

/** Cuadrado lejos de `pending`. */
const norte = {
  ...centro,
  id: 'z-2',
  code: 'ZN-2',
  name: 'Zona Norte',
  ring: [
    { latitude: 1.0, longitude: -78.0 },
    { latitude: 1.0, longitude: -77.9 },
    { latitude: 0.9, longitude: -77.9 },
    { latitude: 0.9, longitude: -78.0 },
  ],
}

function mockOrders(orders: Order[], coverage: { status: number; body: unknown }) {
  return mockApi((url, init) => {
    if (url.endsWith('/api/v1/orders') && (init.method ?? 'GET') === 'GET') return { status: 200, body: orders }
    if (url.endsWith('/api/v1/coverage/zones')) return coverage
    if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
    return { status: 200, body: { status: 'ready' } }
  })
}

const withZones = (...zones: unknown[]) => ({ status: 200, body: { zones } })

beforeEach(() => {
  useSession.getState().setToken('tok')
})

async function openDetail(user: ReturnType<typeof userEvent.setup>, address: string) {
  await user.click(await screen.findByText(address, undefined, { timeout: 5000 }))
  return screen.findByRole('dialog', { name: 'Detalle del pedido' })
}

describe('detalle del pedido', () => {
  it('al hacer clic en un pedido abre un modal con todos sus datos', async () => {
    mockOrders([pending], withZones(centro))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText('Vía Interoceánica, Guápulo, Quito')).toBeInTheDocument()
    expect(within(dialog).getByText('Pendiente')).toBeInTheDocument()
    expect(within(dialog).getByText('09:00–12:00')).toBeInTheDocument()
    expect(within(dialog).getByText('Casa blanca, portón verde')).toBeInTheDocument()
    expect(within(dialog).getByText('170150')).toBeInTheDocument()
    expect(within(dialog).getByText('0991112233')).toBeInTheDocument()
    expect(within(dialog).getByText('-0.18900, -78.46300')).toBeInTheDocument()
  })

  it('muestra el mapa con el punto del pedido y la zona que lo contiene resaltada', async () => {
    mockOrders([pending], withZones(norte, centro))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')

    expect(await within(dialog).findByText('Zona Centro (ZC-1)')).toBeInTheDocument()
    const map = within(dialog).getByTestId('order-map')
    expect(map).toHaveAttribute('data-picked', '-0.189,-78.463')
    expect(map).toHaveAttribute('data-highlight', '4')
    expect(map).toHaveAttribute('data-zones', '2')
  })

  it('si el punto no cae en ninguna zona lo dice y no resalta nada', async () => {
    mockOrders([pending], withZones(norte))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')

    expect(await within(dialog).findByText('Fuera de las zonas de cobertura')).toBeInTheDocument()
    const map = within(dialog).getByTestId('order-map')
    expect(map).toHaveAttribute('data-highlight', '0')
    expect(map).toHaveAttribute('data-picked', '-0.189,-78.463')
  })

  it('si no se pueden cargar las zonas lo avisa y aun así muestra el punto', async () => {
    mockOrders([pending], apiError(503, 'UPSTREAM_UNAVAILABLE'))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')

    expect(await within(dialog).findByText('No se pudo cargar la cobertura.')).toBeInTheDocument()
    expect(within(dialog).getByTestId('order-map')).toHaveAttribute('data-picked', '-0.189,-78.463')
  })

  it('un pedido sin referencia ni teléfono (anterior a esos campos) no muestra datos vacíos', async () => {
    const legacy: Order = { ...pending }
    delete legacy.addressReference
    delete legacy.postalCode
    delete legacy.contactPhone
    mockOrders([legacy], withZones(centro))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')

    expect(within(dialog).getAllByText('Sin datos')).toHaveLength(3)
  })

  it('se cierra con Cerrar y con Escape', async () => {
    mockOrders([pending], withZones(centro))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('un pedido en revisión muestra sus motivos y permite pasar a revisarlo', async () => {
    mockOrders([inReview], withZones(centro))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Plaza Foch, Quito')
    expect(within(dialog).getByText('Cliente bloqueado')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Revisar pedido' }))

    expect(screen.queryByRole('dialog', { name: 'Detalle del pedido' })).not.toBeInTheDocument()
    expect(await screen.findByRole('dialog', { name: 'Revisar pedido' })).toBeInTheDocument()
  })

  it('un pedido que no está en revisión no ofrece revisar', async () => {
    mockOrders([pending], withZones(centro))
    renderApp('/orders')
    const user = userEvent.setup()

    const dialog = await openDetail(user, 'Vía Interoceánica, Guápulo, Quito')

    expect(within(dialog).queryByRole('button', { name: 'Revisar pedido' })).not.toBeInTheDocument()
  })

  it('el botón Revisar de la fila abre directamente la revisión, no el detalle', async () => {
    mockOrders([inReview], withZones(centro))
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))

    expect(await screen.findByRole('dialog', { name: 'Revisar pedido' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Detalle del pedido' })).not.toBeInTheDocument()
  })
})
