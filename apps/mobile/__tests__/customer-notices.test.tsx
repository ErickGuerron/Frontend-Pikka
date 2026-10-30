import { render, renderHook, screen, waitFor } from '@testing-library/react-native'
import { NotificationsPanel } from '../src/features/customer-orders/NotificationsPanel'
import { useMyNotifications } from '../src/features/customer-orders/notifications-hooks'
import {
  notificationDetail,
  notificationTitle,
  parseNotifications,
  type CustomerNotification,
} from '../src/features/customer-orders/notifications'
import * as api from '../src/features/customer-orders/api'

jest.mock('../src/features/customer-orders/api')
const mocked = jest.mocked(api)

const base = { id: 'n-1', orderId: 'o-1', createdAt: '2026-10-01T09:00:00Z', read: false }
const notice = (kind: CustomerNotification['kind'], detail: string, over: Partial<CustomerNotification> = {}): CustomerNotification => ({
  ...base,
  kind,
  detail,
  ...over,
})

describe('parseNotifications', () => {
  it('accepts every kind, including the account block that has no order', () => {
    const list = parseNotifications({
      notifications: [
        { ...base, kind: 'SURCHARGE_APPLIED', detail: 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z' },
        { ...base, id: 'n-2', orderId: '', kind: 'ACCOUNT_BLOCKED_BY_BALANCE', detail: '' },
        { ...base, id: 'n-3', kind: 'ORDER_CONFIRMED', detail: 'ok' },
      ],
    })
    expect(list.map((n) => n.kind)).toEqual(['SURCHARGE_APPLIED', 'ACCOUNT_BLOCKED_BY_BALANCE', 'ORDER_CONFIRMED'])
  })

  it('ignores a kind it does not know instead of losing the known ones', () => {
    const list = parseNotifications({
      notifications: [
        { ...base, kind: 'SURCHARGE_APPLIED', detail: 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z' },
        { ...base, id: 'n-9', kind: 'FUTURE_KIND', detail: '' },
      ],
    })
    expect(list).toHaveLength(1)
  })

  it('a malformed notice of a known kind is an error, and so is a body without the list', () => {
    expect(() => parseNotifications({ notifications: [{ ...base, kind: 'ORDER_CONFIRMED' }] })).toThrow()
    expect(() => parseNotifications({})).toThrow()
  })
})

describe('notification texts', () => {
  it('has a title for each new kind', () => {
    expect(notificationTitle('SURCHARGE_APPLIED')).toBe('Se aplicó un recargo a tu cuenta')
    expect(notificationTitle('ACCOUNT_BLOCKED_BY_BALANCE')).toBe('Tu cuenta quedó bloqueada por saldo pendiente')
  })

  it('builds the surcharge text with reason, amount and due date', () => {
    expect(notificationDetail(notice('SURCHARGE_APPLIED', 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z'))).toBe(
      'Rechazaste el pedido en la entrega: $3.00. Pagar antes del 15/10/2026.',
    )
  })

  it.each(['', 'CLIENT_REFUSED', 'CLIENT_REFUSED,3.00', 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z,extra'])(
    'a malformed surcharge detail (%j) shows no raw text',
    (detail) => {
      expect(notificationDetail(notice('SURCHARGE_APPLIED', detail))).toBe('')
    },
  )

  it('the block explains how to get out of it, whatever the detail says', () => {
    const text = 'Paga tu saldo para volver a crear y cancelar pedidos.'
    expect(notificationDetail(notice('ACCOUNT_BLOCKED_BY_BALANCE', ''))).toBe(text)
    expect(notificationDetail(notice('ACCOUNT_BLOCKED_BY_BALANCE', 'unexpected'))).toBe(text)
  })

  it('keeps the review texts as they were', () => {
    expect(notificationDetail(notice('ORDER_REJECTED', 'Dirección imposible de ubicar'))).toBe('Dirección imposible de ubicar')
    expect(notificationDetail(notice('ORDER_IN_REVIEW', 'ZONE_NOT_COVERED'))).not.toBe('')
  })
})

describe('NotificationsPanel', () => {
  it('shows each notice with its title and text', async () => {
    await render(
      <NotificationsPanel
        notifications={[
          notice('SURCHARGE_APPLIED', 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z'),
          notice('ACCOUNT_BLOCKED_BY_BALANCE', '', { id: 'n-2', orderId: '' }),
        ]}
      />,
    )
    expect(await screen.findByText('Se aplicó un recargo a tu cuenta')).toBeTruthy()
    expect(screen.getByText('Rechazaste el pedido en la entrega: $3.00. Pagar antes del 15/10/2026.')).toBeTruthy()
    expect(screen.getByText('Tu cuenta quedó bloqueada por saldo pendiente')).toBeTruthy()
    expect(screen.getByText('Paga tu saldo para volver a crear y cancelar pedidos.')).toBeTruthy()
  })

  it('takes up no space when there is nothing to say', async () => {
    const { toJSON } = await render(<NotificationsPanel notifications={[]} />)
    expect(toJSON()).toBeNull()
  })
})

describe('useMyNotifications', () => {
  beforeEach(() => {
    mocked.listMyNotifications.mockReset()
  })

  it('loads the notices', async () => {
    mocked.listMyNotifications.mockResolvedValue([notice('ORDER_CONFIRMED', 'ok')])
    const { result } = await renderHook(() => useMyNotifications())
    await waitFor(() => { expect(result.current.notifications).toHaveLength(1) })
  })

  it('stays empty, without crashing, when the service does not answer', async () => {
    mocked.listMyNotifications.mockRejectedValue(new Error('down'))
    const { result } = await renderHook(() => useMyNotifications())
    await waitFor(() => { expect(mocked.listMyNotifications).toHaveBeenCalled() })
    expect(result.current.notifications).toEqual([])
  })
})
