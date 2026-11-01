import * as Location from 'expo-location'

import {
  captureDriverLocation,
  LocationUnavailableError,
  LOCATION_DENIED_MESSAGE,
} from '../src/features/driver-route/location'

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}))

const requestPermission = Location.requestForegroundPermissionsAsync as jest.Mock
const currentPosition = Location.getCurrentPositionAsync as jest.Mock

describe('captureDriverLocation', () => {
  beforeEach(() => {
    requestPermission.mockReset()
    currentPosition.mockReset()
  })

  it('returns the position when the driver grants foreground permission', async () => {
    requestPermission.mockResolvedValue({ status: 'granted' })
    currentPosition.mockResolvedValue({ coords: { latitude: -0.181, longitude: -78.468 } })

    await expect(captureDriverLocation()).resolves.toEqual({ latitude: -0.181, longitude: -78.468 })
    expect(currentPosition).toHaveBeenCalledWith({ accuracy: 4 })
  })

  it('refuses without asking for a position when permission is denied', async () => {
    requestPermission.mockResolvedValue({ status: 'denied' })

    await expect(captureDriverLocation()).rejects.toBeInstanceOf(LocationUnavailableError)
    expect(currentPosition).not.toHaveBeenCalled()
  })

  it('turns a device error into the same user-facing message', async () => {
    requestPermission.mockResolvedValue({ status: 'granted' })
    currentPosition.mockRejectedValue(new Error('gps off'))

    await expect(captureDriverLocation()).rejects.toThrow(LOCATION_DENIED_MESSAGE)
  })
})
