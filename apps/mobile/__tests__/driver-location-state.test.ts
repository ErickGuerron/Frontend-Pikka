import { renderHook, waitFor } from '@testing-library/react-native'
import * as Location from 'expo-location'

import { reportDriverLocation } from '../src/features/driver-route/api'
import { useDriverLocationReporter } from '../src/features/driver-route/location-reporter'

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}))

jest.mock('../src/features/driver-route/api', () => ({
  reportDriverLocation: jest.fn(),
}))

const requestPermission = Location.requestForegroundPermissionsAsync as jest.Mock
const currentPosition = Location.getCurrentPositionAsync as jest.Mock
const report = reportDriverLocation as jest.Mock
const here = { latitude: -0.181, longitude: -78.468 }

beforeEach(() => {
  requestPermission.mockReset()
  currentPosition.mockReset()
  report.mockReset()
  report.mockResolvedValue(undefined)
})

describe('useDriverLocationReporter', () => {
  it('expone la última posición compartida para dibujarla en el mapa', async () => {
    requestPermission.mockResolvedValue({ status: 'granted' })
    currentPosition.mockResolvedValue({ coords: here })

    const { result } = await renderHook(() => useDriverLocationReporter(true))

    await waitFor(() => { expect(result.current.position).toEqual(here) })
    expect(result.current.tracking).toBe('on')
  })

  it('no tiene posición cuando el permiso se niega', async () => {
    requestPermission.mockResolvedValue({ status: 'denied' })

    const { result } = await renderHook(() => useDriverLocationReporter(true))

    await waitFor(() => { expect(result.current.tracking).toBe('denied') })
    expect(result.current.position).toBeNull()
  })

  it('no tiene posición cuando no está activo', async () => {
    const { result } = await renderHook(() => useDriverLocationReporter(false))

    expect(result.current.tracking).toBe('off')
    expect(result.current.position).toBeNull()
    expect(requestPermission).not.toHaveBeenCalled()
  })
})
