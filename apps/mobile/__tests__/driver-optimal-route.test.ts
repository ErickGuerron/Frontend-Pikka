import { parseRoutePlan } from '../src/features/driver-route/plan'
import { attendOrder, focusPoints } from '../src/features/driver-route/attend'
import { routeMapState } from '../src/features/driver-route/map-state'

describe('parseRoutePlan', () => {
  it('reads the best order, the totals and the geometry as lat,lon points', () => {
    expect(
      parseRoutePlan({
        order: ['o-3', 'o-1'],
        distanceMeters: 2400,
        durationSeconds: 420,
        geometry: [[-0.2, -78.5], [-0.18, -78.48]],
      }),
    ).toEqual({
      order: ['o-3', 'o-1'],
      distanceMeters: 2400,
      durationSeconds: 420,
      geometry: [{ latitude: -0.2, longitude: -78.5 }, { latitude: -0.18, longitude: -78.48 }],
    })
  })

  it('rejects a body that is not a plan', () => {
    expect(() => parseRoutePlan({ order: 'o-1' })).toThrow()
    expect(() => parseRoutePlan(null)).toThrow()
  })
})

describe('attendOrder', () => {
  const plan = ['o-3', 'o-1', 'o-2']

  it('follows the optimal order when nothing is pinned', () => {
    expect(attendOrder(plan, null, ['o-1', 'o-2', 'o-3'])).toEqual(['o-3', 'o-1', 'o-2'])
  })

  it('moves the pinned order to the front and keeps the rest of the optimal order', () => {
    expect(attendOrder(plan, 'o-2', ['o-1', 'o-2', 'o-3'])).toEqual(['o-2', 'o-3', 'o-1'])
  })

  it('ignores a pin that is no longer active and appends stops the plan does not know yet', () => {
    expect(attendOrder(['o-3'], 'o-9', ['o-1', 'o-3'])).toEqual(['o-3', 'o-1'])
  })
})

describe('focusPoints', () => {
  const at = (id: string) => ({ id, latitude: Number(id.slice(-1)), longitude: 0 })

  it('returns the pinned stop and the next one to follow', () => {
    expect(focusPoints([at('a1'), at('a2'), at('a3')])).toEqual([
      { latitude: 1, longitude: 0 },
      { latitude: 2, longitude: 0 },
    ])
  })

  it('returns only the pinned stop when it is the last one', () => {
    expect(focusPoints([at('a1')])).toEqual([{ latitude: 1, longitude: 0 }])
  })

  it('returns nothing when there is no active stop', () => {
    expect(focusPoints([])).toEqual([])
  })
})

describe('routeMapState with the optimal route', () => {
  const stopA = { latitude: -0.18, longitude: -78.47 }
  const road = [{ latitude: -0.2, longitude: -78.5 }, { latitude: -0.18, longitude: -78.48 }]

  it('draws the road geometry and asks the map to fit the given points', () => {
    const state = routeMapState([stopA], null, { road, fit: [stopA] })

    expect(state.road).toEqual(road)
    expect(state.fit).toEqual({ points: [stopA], key: expect.any(String) })
  })

  it('has no road and no fit request by default', () => {
    const state = routeMapState([stopA], null)

    expect(state.road).toEqual([])
    expect(state.fit).toBeNull()
  })
})
