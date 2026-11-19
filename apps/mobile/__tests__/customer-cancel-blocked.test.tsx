import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { ApiError } from '../src/api/errors'
import { CurrentOrderCard } from '../src/features/customer-orders/CurrentOrderCard'
import type { CustomerOrder } from '../src/features/customer-orders/types'
import { cancelOrder } from '../src/features/customer-orders/api'

jest.mock('../src/features/customer-orders/api', () => ({
  ...jest.requireActual('../src/features/customer-orders/api'),
  cancelOrder: jest.fn(),
}))

// The tracking section needs a native WebView; it is not under test here.
jest.mock('../src/features/customer-orders/OrderTrackingSection', () => ({ OrderTrackingSection: () => null }))

const order: CustomerOrder = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  address: 'Av. Central 123',
  deliveryDate: '2099-12-31',
  windowStart: '09:00',
  windowEnd: '12:00',
  status: 'PENDING',
  reviewReasons: [],
  createdAt: '2026-10-10T12:00:00Z',
  queuePosition: 0,
}
const message = 'Paga tu saldo pendiente para volver a cancelar pedidos.'

afterEach(() => {
  jest.restoreAllMocks()
  jest.mocked(cancelOrder).mockReset()
})

describe('CurrentOrderCard: cancel with the account blocked for the balance', () => {
  it('disables Cancelar pedido and says how to cancel again', async () => {
    await render(<CurrentOrderCard order={order} cancelBlocked />)

    expect(screen.getByLabelText('Cancelar pedido').props.accessibilityState).toMatchObject({ disabled: true })
    expect(screen.getByText(message)).toBeTruthy()
  })

  it('leaves the button enabled and says nothing for an active account', async () => {
    await render(<CurrentOrderCard order={order} />)

    expect(screen.getByLabelText('Cancelar pedido').props.accessibilityState).toMatchObject({ disabled: false })
    expect(screen.queryByText(message)).toBeNull()
  })

  it('shows the balance message, not the generic one, when the server answers 403', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    jest.mocked(cancelOrder).mockRejectedValue(new ApiError(403, 'FORBIDDEN', 'forbidden'))
    await render(<CurrentOrderCard order={order} />)

    await fireEvent.press(screen.getByLabelText('Cancelar pedido'))
    const buttons = alert.mock.calls[0]?.[2]
    buttons?.find((b) => b.style === 'destructive')?.onPress?.()

    await waitFor(() => { expect(alert).toHaveBeenCalledWith('No se pudo cancelar', message) })
  })
})
