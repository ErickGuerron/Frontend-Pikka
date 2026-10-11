import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { adminUser, apiError, mockApi, renderApp, sentBody } from '@/test/utils'
import type { Order } from './types'

// El mapa real necesita un navegador (lo cubre el e2e). Aquí un botón emite un punto fijo.
vi.mock('@/features/geo/LazyMapCanvas', async () => {
  const { createElement } = await import('react')
  return {
    LazyMapCanvas: ({ onMapClick }: { onMapClick: (point: { latitude: number; longitude: number }) => void }) =>
      createElement(
        'button',
        { type: 'button', onClick: () => { onMapClick({ latitude: -0.2, longitude: -78.5 }); } },
        'Elegir punto en mapa',
      ),
  }
})

const pendingOrder: Order = {
  id: 'o-1',
  address: 'Av. Central 123, Col. Centro',
  latitude: -0.2,
  longitude: -78.5,
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '11:00',
  status: 'PENDING',
  createdAt: '2026-10-10T12:00:00Z',
}

const deliveredOrder: Order = { ...pendingOrder, id: 'o-2', address: 'Calle Norte 45', status: 'DELIVERED' }

/** Responde al perfil autenticado y a /ready; el resto lo decide cada prueba. */
function baseHandler(url: string) {
  if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
  return { status: 200, body: { status: 'ready' } }
}

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('listado de pedidos', () => {
  it('muestra los pedidos con su estado en texto', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/api/v1/orders') && (init.method ?? 'GET') === 'GET') return { status: 200, body: [pendingOrder, deliveredOrder] }
      return baseHandler(url)
    })
    renderApp('/orders')

    expect(await screen.findByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
    expect(screen.getByText('Calle Norte 45')).toBeInTheDocument()
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
    expect(screen.getByText('Entregado', { selector: 'span' })).toBeInTheDocument()
  })

  it('muestra un estado vacío con acción para registrar el primero', async () => {
    mockApi((url) => (url.endsWith('/api/v1/orders') ? { status: 200, body: [] } : baseHandler(url)))
    renderApp('/orders')

    expect(await screen.findByText('Aún no hay pedidos registrados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar primer pedido' })).toBeInTheDocument()
  })

  it('muestra el error con reintento y recupera los datos al reintentar', async () => {
    let attempts = 0
    mockApi((url) => {
      if (url.endsWith('/api/v1/orders')) {
        attempts += 1
        return attempts === 1 ? apiError(503, 'UPSTREAM_UNAVAILABLE') : { status: 200, body: [pendingOrder] }
      }
      return baseHandler(url)
    })
    renderApp('/orders')
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los pedidos.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
  })

  it('filtra por estado y permite limpiar el filtro', async () => {
    mockApi((url) => (url.endsWith('/api/v1/orders') ? { status: 200, body: [pendingOrder, deliveredOrder] } : baseHandler(url)))
    renderApp('/orders')
    const user = userEvent.setup()

    await screen.findByText('Av. Central 123, Col. Centro')
    await user.selectOptions(screen.getByLabelText('Estado'), 'DELIVERED')
    expect(screen.queryByText('Av. Central 123, Col. Centro')).not.toBeInTheDocument()
    expect(screen.getByText('Calle Norte 45')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar filtro' }))
    expect(screen.getByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
  })
})

describe('registro de pedido', () => {
  it('no envía el formulario vacío y muestra los errores por campo, incluida la ubicación', async () => {
    const fetchMock = mockApi((url) => (url.endsWith('/api/v1/orders') ? { status: 200, body: [] } : baseHandler(url)))
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    expect(screen.getByText('Elige la ubicación de entrega en el mapa.')).toBeInTheDocument()
    expect(screen.getByText('Escribe la dirección completa (mínimo 5 caracteres).')).toBeInTheDocument()
    expect(screen.getByText('Elige la fecha de entrega.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Dirección de entrega/)).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('registra el pedido con la ubicación del mapa y confirma el resultado', async () => {
    let created = false
    const fetchMock = mockApi((url, init) => {
      if (url.endsWith('/api/v1/orders') && init.method === 'POST') {
        created = true
        return { status: 201, body: pendingOrder }
      }
      if (url.endsWith('/api/v1/orders')) return { status: 200, body: created ? [pendingOrder] : [] }
      return baseHandler(url)
    })
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: 'Elegir punto en mapa' }))
    await user.type(screen.getByLabelText(/Dirección de entrega/), '  Av. Central 123, Col. Centro  ')
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2099-12-31' } })
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '11:00' } })
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido registrado para el')
    const call = fetchMock.mock.calls.find(([u, i]) => u.endsWith('/api/v1/orders') && i?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({
      address: 'Av. Central 123, Col. Centro',
      latitude: -0.2,
      longitude: -78.5,
      deliveryDate: '2099-12-31',
      windowStart: '09:00',
      windowEnd: '11:00',
    })
    expect(screen.queryByRole('button', { name: 'Registrar pedido' })).not.toBeInTheDocument()
  })

  it('conserva los datos y muestra el error si el registro falla', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/api/v1/orders') && init.method === 'POST') return apiError(500, 'INTERNAL')
      if (url.endsWith('/api/v1/orders')) return { status: 200, body: [] }
      return baseHandler(url)
    })
    renderApp('/orders')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: 'Elegir punto en mapa' }))
    await user.type(screen.getByLabelText(/Dirección de entrega/), 'Av. Central 123')
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2099-12-31' } })
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '11:00' } })
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar el pedido.')
    expect(screen.getByLabelText(/Dirección de entrega/)).toHaveValue('Av. Central 123')
  })
})
