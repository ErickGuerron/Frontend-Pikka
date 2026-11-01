import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import type { Order } from '@/features/orders/types'
import { adminUser, apiError, mockApi, renderApp } from '@/test/utils'

const exception: Order = {
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

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('excepciones: mensaje de la decisión', () => {
  it('el aviso de la decisión se puede cerrar con su botón', async () => {
    const queue = [exception]
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/orders/exceptions')) return { status: 200, body: queue }
      if (url.endsWith('/review') && init.method === 'POST') {
        queue.splice(0, queue.length)
        return { status: 200, body: { ...exception, status: 'PENDING' } }
      }
      return { status: 200, body: [] }
    })
    renderApp('/exceptions')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    await user.click(screen.getByLabelText(/^Rechazar/))
    await user.type(screen.getByLabelText('Motivo *'), 'Dirección fuera del área de cobertura')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent('Pedido rechazado.')
    await user.click(within(notice).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('excepciones: revisión y carga', () => {
  it('Escape cierra el diálogo de revisión sin enviar nada', async () => {
    const fetchCalls: string[] = []
    mockApi((url, init) => {
      fetchCalls.push(`${init.method ?? 'GET'} ${url}`)
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/orders/exceptions')) return { status: 200, body: [exception] }
      return { status: 200, body: [] }
    })
    renderApp('/exceptions')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Revisar' }, { timeout: 5000 }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(fetchCalls.some((call) => call.startsWith('POST'))).toBe(false)
  })

  it('si la cola no carga, Reintentar vuelve a pedirla', async () => {
    let calls = 0
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return { status: 200, body: adminUser }
      if (url.endsWith('/ready')) return { status: 200, body: { status: 'ready' } }
      if (url.endsWith('/api/v1/orders/exceptions')) {
        calls += 1
        return calls === 1 ? apiError(500, 'INTERNAL') : { status: 200, body: [] }
      }
      return { status: 200, body: [] }
    })
    renderApp('/exceptions')
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las excepciones.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('No hay pedidos pendientes de revisión.')).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})
