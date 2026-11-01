import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/session-store'
import { sentBody, renderApp } from '@/test/utils'
import { buildException, mockQueue } from './exceptions.fixtures'
import { openReview } from './exceptions.test-utils'

const exception = buildException()

beforeEach(() => {
  useSession.getState().setToken('tok')
})

describe('cola de excepciones', () => {
  it('lista los pedidos en revisión con sus motivos', async () => {
    mockQueue([exception])
    renderApp('/exceptions')

    expect(await screen.findByText('Av. Central 123, Col. Centro')).toBeInTheDocument()
    expect(screen.getByText('Fuera de una zona atendida')).toBeInTheDocument()
    expect(screen.getByText('Ventana de entrega no válida')).toBeInTheDocument()
  })

  it('muestra un estado vacío cuando no hay excepciones', async () => {
    mockQueue([])
    renderApp('/exceptions')

    expect(await screen.findByText('No hay pedidos pendientes de revisión.')).toBeInTheDocument()
  })

  it('no envía el rechazo sin motivo y pide escribirlo', async () => {
    const fetchMock = mockQueue([exception])
    renderApp('/exceptions')
    const user = userEvent.setup()

    await openReview(user)
    await user.click(screen.getByLabelText(/^Rechazar/))
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(screen.getByText('Escribe el motivo de la decisión (mínimo 5 caracteres).')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('rechaza con motivo, envía la decisión y saca el pedido de la cola', async () => {
    const queue = [exception]
    const fetchMock = mockQueue(queue)
    renderApp('/exceptions')
    const user = userEvent.setup()

    await openReview(user)
    await user.click(screen.getByLabelText(/^Rechazar/))
    await user.type(screen.getByLabelText('Motivo *'), '  Dirección fuera del área de cobertura  ')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido rechazado.')
    const call = fetchMock.mock.calls.find(([url, init]) => url.endsWith('/review') && init?.method === 'POST')
    expect(call?.[0]).toMatch(/\/api\/v1\/orders\/o-9\/review$/)
    expect(sentBody(call?.[1])).toEqual({ action: 'REJECT', reason: 'Dirección fuera del área de cobertura' })
    expect(await screen.findByText('No hay pedidos pendientes de revisión.')).toBeInTheDocument()
  })

  it('confirma sin enviar corrección', async () => {
    // Confirmar solo aplica a pedidos sin problema de lugar: se usa un pedido que solo tiene la ventana.
    const fetchMock = mockQueue([{ ...exception, reviewReasons: ['CUSTOMER_BLOCKED'] }])
    renderApp('/exceptions')
    const user = userEvent.setup()

    await openReview(user)
    await user.type(screen.getByLabelText('Motivo *'), 'Cliente frecuente, se acepta la ventana')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido confirmado.')
    const call = fetchMock.mock.calls.find(([url, init]) => url.endsWith('/review') && init?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({ action: 'CONFIRM', reason: 'Cliente frecuente, se acepta la ventana' })
  })

  it('corrige la ventana y envía la corrección completa', async () => {
    const fetchMock = mockQueue([exception])
    renderApp('/exceptions')
    const user = userEvent.setup()

    await openReview(user)
    await user.click(screen.getByLabelText(/^Corregir/))
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '12:00' } })
    await user.type(screen.getByLabelText('Motivo *'), 'Se ajusta la ventana a lo acordado')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido corregido y guardado.')
    const call = fetchMock.mock.calls.find(([url, init]) => url.endsWith('/review') && init?.method === 'POST')
    expect(sentBody(call?.[1])).toEqual({
      action: 'CORRECT',
      reason: 'Se ajusta la ventana a lo acordado',
      correction: {
        address: 'Av. Central 123, Col. Centro',
        deliveryDate: '2099-12-31',
        windowStart: '09:00',
        windowEnd: '12:00',
      },
    })
  })

  it('no corrige a una fecha anterior a hoy', async () => {
    const fetchMock = mockQueue([exception])
    renderApp('/exceptions')
    const user = userEvent.setup()

    await openReview(user)
    await user.click(screen.getByLabelText(/^Corregir/))
    fireEvent.change(screen.getByLabelText(/Fecha de entrega/), { target: { value: '2000-01-01' } })
    await user.type(screen.getByLabelText('Motivo *'), 'Fecha corregida a una fecha pasada')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByText('La fecha de entrega no puede ser anterior a hoy.')).toBeInTheDocument()
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url, init]) => url.endsWith('/review') && init?.method === 'POST')).toBe(false)
    })
  })

  it('no ofrece confirmar un pedido fuera de zona: la corrección queda seleccionada', async () => {
    mockQueue([exception])
    renderApp('/exceptions')
    const user = userEvent.setup()

    await openReview(user)

    expect(screen.getByLabelText(/^Confirmar/)).toBeDisabled()
    expect(screen.getByLabelText(/^Corregir/)).toBeChecked()
  })

  it('muestra el motivo de dirección no localizada con su texto', async () => {
    mockQueue([{ ...exception, reviewReasons: ['ADDRESS_NOT_LOCATED'] }])
    renderApp('/exceptions')

    expect(await screen.findByText('Dirección no localizada en el mapa')).toBeInTheDocument()
  })
})
