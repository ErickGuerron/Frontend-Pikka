import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import * as Location from 'expo-location'

import DriverRouteScreen from '../src/app/(app)/ruta/index'
import { resetDemoRoute } from '../src/features/driver-route/demo'
import { RouteStopCard } from '../src/features/driver-route/RouteStopCard'
import { LOCATION_DENIED_MESSAGE } from '../src/features/driver-route/location'
import type { RouteStop } from '../src/features/driver-route/types'

// El mapa real es un WebView/iframe con Leaflet; aquí un doble muestra el estado que recibe.
jest.mock('../src/features/customer-orders/map/LeafletMap', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    LeafletMap: ({ state }: { state: unknown }) => React.createElement(Text, { testID: 'map-state' }, JSON.stringify(state)),
  }
})

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}))

const requestPermission = Location.requestForegroundPermissionsAsync as jest.Mock
const currentPosition = Location.getCurrentPositionAsync as jest.Mock
const here = { latitude: -0.181, longitude: -78.468 }

function stop(over: Partial<RouteStop> = {}): RouteStop {
  return { id: 'stop-1', sequence: 1, address: 'Av. Amazonas N24-03', windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null, ...over }
}

function grantLocation() {
  requestPermission.mockResolvedValue({ status: 'granted' })
  currentPosition.mockResolvedValue({ coords: here })
}

beforeEach(() => {
  requestPermission.mockReset()
  currentPosition.mockReset()
  grantLocation()
})

describe('RouteStopCard', () => {
  it('offers the next progress step and both results for a pending stop', async () => {
    await render(<RouteStopCard stop={stop()} onSubmit={jest.fn()} onAdvance={jest.fn()} />)

    expect(screen.getByText('Marcar recogido')).toBeTruthy()
    expect(screen.getByText('Entregado')).toBeTruthy()
    expect(screen.getByText('No entregado')).toBeTruthy()
  })

  it('advances a pending stop to recogido without asking for a result', async () => {
    const onAdvance = jest.fn()
    await render(<RouteStopCard stop={stop()} onSubmit={jest.fn()} onAdvance={onAdvance} />)

    await fireEvent.press(screen.getByText('Marcar recogido'))

    expect(onAdvance).toHaveBeenCalledWith('stop-1', 'PICKED_UP')
  })

  it('registers a delivery with the GPS position taken at that moment', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    await render(<RouteStopCard stop={stop({ status: 'IN_TRANSIT' })} onSubmit={onSubmit} onAdvance={jest.fn()} />)

    await fireEvent.press(screen.getByText('Entregado'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('stop-1', { outcome: 'DELIVERED', location: here }))
  })

  it('requires a closed reason before a failed delivery can be confirmed', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    await render(<RouteStopCard stop={stop({ status: 'IN_TRANSIT' })} onSubmit={onSubmit} onAdvance={jest.fn()} />)

    await fireEvent.press(screen.getByText('No entregado'))
    await fireEvent.press(screen.getByText('Confirmar no entregado'))
    expect(onSubmit).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByText('El cliente no estaba'))
    await fireEvent.press(screen.getByText('Confirmar no entregado'))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('stop-1', { outcome: 'NOT_DELIVERED', reason: 'CLIENT_ABSENT', location: here }),
    )
  })

  it('does not send a result when the driver refuses location', async () => {
    requestPermission.mockResolvedValue({ status: 'denied' })
    const onSubmit = jest.fn()
    await render(<RouteStopCard stop={stop({ status: 'IN_TRANSIT' })} onSubmit={onSubmit} onAdvance={jest.fn()} />)

    await fireEvent.press(screen.getByText('Entregado'))

    expect(await screen.findByText(LOCATION_DENIED_MESSAGE)).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows no actions once the stop has a final result', async () => {
    await render(<RouteStopCard stop={stop({ status: 'DELIVERED' })} onSubmit={jest.fn()} onAdvance={jest.fn()} />)

    // "Entregado" aparece una sola vez: es el estado del encabezado, no un botón.
    expect(screen.getAllByText('Entregado')).toHaveLength(1)
    expect(screen.queryByText('No entregado')).toBeNull()
    expect(screen.queryByText('Marcar recogido')).toBeNull()
  })
})

describe('driver route screen in demo mode', () => {
  const previous = process.env.EXPO_PUBLIC_MOCK_DRIVER_ROUTE

  beforeAll(() => {
    process.env.EXPO_PUBLIC_MOCK_DRIVER_ROUTE = 'true'
  })

  afterAll(() => {
    process.env.EXPO_PUBLIC_MOCK_DRIVER_ROUTE = previous
  })

  beforeEach(() => {
    resetDemoRoute()
  })

  it('loads the ordered stops and shows the progress line', async () => {
    await render(<DriverRouteScreen />)

    expect(await screen.findByText(/0 de 4 completadas · 4 pendientes/)).toBeTruthy()
    // La dirección aparece en la tarjeta de la parada y en la lista de pedidos activos.
    expect(screen.getAllByText('Av. Amazonas N24-03, Quito').length).toBeGreaterThan(0)
  })

  it('draws the pending stops on the real map, numbered in route order', async () => {
    await render(<DriverRouteScreen />)
    await screen.findByText(/0 de 4 completadas/)

    const state = JSON.parse(screen.getByTestId('map-state').props.children as string)
    expect(state.stops).toHaveLength(4)
    expect(state.stops[0]).toEqual({ latitude: -0.2012, longitude: -78.4965 })
  })

  it('moves a stop through recogido, en camino and delivered, and updates progress', async () => {
    await render(<DriverRouteScreen />)
    await screen.findByText(/0 de 4 completadas/)

    await fireEvent.press(screen.getAllByText('Marcar recogido')[0])
    expect(await screen.findByText('Recogido')).toBeTruthy()

    await fireEvent.press(screen.getAllByText('Marcar en camino')[0])
    expect(await screen.findByText('En camino')).toBeTruthy()

    await fireEvent.press(screen.getAllByText('Entregado')[0])
    expect(await screen.findByText(/1 de 4 completadas · 3 pendientes/)).toBeTruthy()
  })
})
