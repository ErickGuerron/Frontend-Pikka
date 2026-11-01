import { canCancel, type OrderStatus } from '../src/features/customer-orders/types'

describe('PLAN: canCancel truth table (mobile)', () => {
  // KEEP IDENTICAL to apps/web/src/features/customer-orders/myOrders.plan.test.tsx: web and mobile must
  // agree on which order states a customer may cancel (order-state consistency check).
  const expected: Record<OrderStatus, boolean> = {
    PENDING: true,
    PENDING_REVIEW: false,
    ROUTE_ASSIGNED: true,
    PICKED_UP: false,
    IN_TRANSIT: false,
    DELIVERED: false,
    NOT_DELIVERED: false,
    CANCELLED: false,
  }

  it.each(Object.entries(expected) as [OrderStatus, boolean][])('canCancel_%s_returns_%s', (status, allowed) => {
    expect(canCancel(status)).toBe(allowed)
  })

  it('canCancel_coversEveryStatusExactlyOnce', () => {
    expect(Object.keys(expected)).toHaveLength(8)
  })
})
