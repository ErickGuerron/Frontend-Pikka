import { parseTrackingSnapshot } from '../src/features/customer-orders/tracking'

function raw(extra: Record<string, unknown> = {}) {
  return {
    order_id: 'o-1',
    status: 'ROUTE_ASSIGNED',
    delivery_address: 'Av. Amazonas 123',
    delivery_window: { start: '10:00', end: '12:00' },
    eta: null,
    stops_before: 0,
    driver_position: null,
    delivery_point: { latitude: -0.18, longitude: -78.47 },
    updated_at: '2026-10-20T10:00:00Z',
    ...extra,
  }
}

describe('parseTrackingSnapshot road', () => {
  it('reads the road from the driver to the delivery point as coordinates', () => {
    const snap = parseTrackingSnapshot(raw({ road: [[-0.19, -78.49], [-0.185, -78.485]] }))

    expect(snap.road).toEqual([
      { latitude: -0.19, longitude: -78.49 },
      { latitude: -0.185, longitude: -78.485 },
    ])
  })

  it('has no road when the gateway sends null or omits it', () => {
    expect(parseTrackingSnapshot(raw({ road: null })).road).toEqual([])
    expect(parseTrackingSnapshot(raw()).road).toEqual([])
  })

  it('ignores a malformed road instead of failing the whole snapshot', () => {
    expect(parseTrackingSnapshot(raw({ road: [[1], 'x'] })).road).toEqual([])
    expect(parseTrackingSnapshot(raw({ road: 'nope' })).road).toEqual([])
  })
})
