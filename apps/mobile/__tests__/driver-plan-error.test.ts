import { renderHook, waitFor } from '@testing-library/react-native'

import { getDriverRoutePlan } from '../src/features/driver-route/api'
import { useRoutePlan } from '../src/features/driver-route/plan-hooks'

jest.mock('../src/features/driver-route/api', () => ({
  getDriverRoutePlan: jest.fn(),
}))

const fetchPlan = getDriverRoutePlan as jest.Mock
const origin = { latitude: -0.181, longitude: -78.468 }

beforeEach(() => {
  fetchPlan.mockReset()
})

describe('useRoutePlan errors', () => {
  it('exposes why the optimal route could not be computed instead of failing silently', async () => {
    fetchPlan.mockRejectedValue(new Error('route planner unavailable'))

    const { result } = await renderHook(() => useRoutePlan(origin, 'o-1,o-2', true))

    await waitFor(() => { expect(result.current.error).toBe('route planner unavailable') })
    expect(result.current.plan).toBeNull()
  })

  it('exposes the plan and no error when the call succeeds', async () => {
    const plan = { order: ['o-2', 'o-1'], distanceMeters: 1, durationSeconds: 1, geometry: [origin] }
    fetchPlan.mockResolvedValue(plan)

    const { result } = await renderHook(() => useRoutePlan(origin, 'o-1,o-2', true))

    await waitFor(() => { expect(result.current.plan).toEqual(plan) })
    expect(result.current.error).toBeNull()
  })

  it('does not call the planner without a position or with the feature off', async () => {
    const { result } = await renderHook(() => useRoutePlan(null, 'o-1', true))
    await renderHook(() => useRoutePlan(origin, 'o-1', false))

    expect(fetchPlan).not.toHaveBeenCalled()
    expect(result.current.plan).toBeNull()
  })
})
