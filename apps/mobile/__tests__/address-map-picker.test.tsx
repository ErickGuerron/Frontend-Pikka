import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'
import { useState } from 'react'
import { AddressMapPicker } from '../src/features/customer-orders/map/AddressMapPicker'
import { useCoverageZones } from '../src/features/customer-orders/map/coverage'
import type { Coordinate, CoverageZone } from '../src/features/customer-orders/map/geo'
import { reverseStreetAddress } from '../src/features/customer-orders/map/photon'

// El mapa real es un WebView/iframe con Leaflet (lo cubre la prueba en navegador). Aquí un doble expone el estado
// que recibe y dos botones emiten un punto dentro y otro fuera de la zona.
jest.mock('../src/features/customer-orders/map/LeafletMap', () => {
  const React = require('react')
  const { Pressable, Text, View } = require('react-native')
  return {
    LeafletMap: ({ state, onPick }: { state: unknown; onPick: (c: { latitude: number; longitude: number }) => void }) =>
      React.createElement(
        View,
        { testID: 'map' },
        React.createElement(Text, { testID: 'map-state' }, JSON.stringify(state)),
        React.createElement(
          Pressable,
          { accessibilityRole: 'button', accessibilityLabel: 'Elegir punto en mapa', onPress: () => { onPick({ latitude: -0.2, longitude: -78.5 }) } },
          React.createElement(Text, null, 'Elegir punto'),
        ),
        React.createElement(
          Pressable,
          { accessibilityRole: 'button', accessibilityLabel: 'Elegir punto fuera de zona', onPress: () => { onPick({ latitude: 40.4, longitude: -3.7 }) } },
          React.createElement(Text, null, 'Fuera'),
        ),
      ),
  }
})
jest.mock('../src/features/customer-orders/map/coverage', () => ({ useCoverageZones: jest.fn() }))
jest.mock('../src/features/customer-orders/map/photon', () => ({
  ...jest.requireActual('../src/features/customer-orders/map/photon'),
  reverseStreetAddress: jest.fn(),
}))

const zone: CoverageZone = {
  id: 'z1',
  code: 'ZC',
  name: 'Zona Centro',
  ring: [
    { latitude: -0.1, longitude: -78.6 },
    { latitude: -0.1, longitude: -78.4 },
    { latitude: -0.3, longitude: -78.4 },
    { latitude: -0.3, longitude: -78.6 },
  ],
  holes: [],
}

const coverage = jest.mocked(useCoverageZones)
  const reverse = jest.mocked(reverseStreetAddress)

function Harness({ initialAddress = '', onAddress, onLocation }: { initialAddress?: string; onAddress?: (a: string) => void; onLocation?: (c: Coordinate | null) => void }) {
  const [location, setLocation] = useState<Coordinate | null>(null)
  const [address, setAddress] = useState(initialAddress)
  return (
    <AddressMapPicker
      location={location}
      address={address}
      onChangeLocation={(next) => { setLocation(next); onLocation?.(next) }}
      onChangeAddress={(next) => { setAddress(next); onAddress?.(next) }}
    />
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  coverage.mockReturnValue({ zones: [zone], loading: false, failed: false })
  reverse.mockResolvedValue('Av. Central 123, Quito')
})

describe('AddressMapPicker', () => {
  it('muestra el mapa con las zonas y ofrece ampliarlo', async () => {
    await render(<Harness />)

    expect(screen.getByLabelText('Ampliar mapa')).toBeTruthy()
    expect(JSON.parse(screen.getByTestId('map-state').props.children as string).zones).toHaveLength(1)
    expect(screen.getByText(/Marca tu punto en el mapa/)).toBeTruthy()
  })

  it('un punto dentro de la cobertura resalta la zona y guarda las coordenadas reales', async () => {
    const onLocation = jest.fn()
    await render(<Harness onLocation={onLocation} />)

    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))

    expect(onLocation).toHaveBeenCalledWith({ latitude: -0.2, longitude: -78.5 })
    expect(await screen.findByText('Dentro de la zona «Zona Centro»: tu pedido no será rechazado por la zona.')).toBeTruthy()
    const state = JSON.parse(screen.getByTestId('map-state').props.children as string)
    expect(state.picked).toEqual({ latitude: -0.2, longitude: -78.5 })
    expect(state.highlightId).toBe('z1')
    expect(screen.getByText('-0.20000, -78.50000')).toBeTruthy()
  })

  it('un punto fuera de las zonas avisa que quedará en revisión', async () => {
    await render(<Harness />)

    await fireEvent.press(screen.getByLabelText('Elegir punto fuera de zona'))

    expect(await screen.findByText(/Fuera de la cobertura: tu pedido quedará en revisión/)).toBeTruthy()
    expect(JSON.parse(screen.getByTestId('map-state').props.children as string).highlightId).toBeNull()
  })

  it('rellena la dirección con la que encuentra Photon', async () => {
    const onAddress = jest.fn()
    await render(<Harness onAddress={onAddress} />)

    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))

    await waitFor(() => { expect(onAddress).toHaveBeenCalledWith('Av. Central 123, Quito') })
    expect(reverse).toHaveBeenCalledWith(-0.2, -78.5, expect.anything())
  })

  it('sin calle cercana no rellena con la ciudad', async () => {
    reverse.mockResolvedValue(null)
    const onAddress = jest.fn()
    await render(<Harness onAddress={onAddress} />)

    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))

    await waitFor(() => { expect(reverse).toHaveBeenCalled() })
    expect(onAddress).not.toHaveBeenCalled()
  })

  it('no pisa una dirección que el cliente escribió a mano', async () => {
    const onAddress = jest.fn()
    await render(<Harness initialAddress="Mi casa, calle 5" onAddress={onAddress} />)

    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))

    await waitFor(() => { expect(reverse).toHaveBeenCalled() })
    expect(onAddress).not.toHaveBeenCalled()
  })

  it('si Photon falla igual conserva el punto elegido', async () => {
    reverse.mockRejectedValue(new Error('sin red'))
    const onLocation = jest.fn()
    await render(<Harness onLocation={onLocation} />)

    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))

    expect(onLocation).toHaveBeenCalledWith({ latitude: -0.2, longitude: -78.5 })
    expect(screen.getByText('-0.20000, -78.50000')).toBeTruthy()
  })

  it('si la cobertura no carga lo avisa sin bloquear la elección', async () => {
    coverage.mockReturnValue({ zones: null, loading: false, failed: true })
    await render(<Harness />)

    expect(screen.getByText(/No pudimos mostrar las zonas de cobertura/)).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))
    expect(screen.getByText('-0.20000, -78.50000')).toBeTruthy()
  })

  it('mientras carga la cobertura lo dice', async () => {
    coverage.mockReturnValue({ zones: null, loading: true, failed: false })
    await render(<Harness />)

    expect(screen.getByText('Cargando zonas de cobertura…')).toBeTruthy()
  })

  it('Quitar punto borra la ubicación', async () => {
    const onLocation = jest.fn()
    await render(<Harness onLocation={onLocation} />)
    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))

    await fireEvent.press(screen.getByLabelText('Quitar punto'))

    expect(onLocation).toHaveBeenLastCalledWith(null)
    expect(screen.queryByText('-0.20000, -78.50000')).toBeNull()
  })
})

describe('mapa ampliado', () => {
  async function expand() {
    await render(<Harness />)
    await fireEvent.press(screen.getByLabelText('Ampliar mapa'))
    return screen.getByTestId('expanded-map')
  }

  it('Ampliar mapa abre el mismo mapa en grande, con las mismas zonas', async () => {
    const big = await expand()

    expect(within(big).getByText('Mapa ampliado')).toBeTruthy()
    expect(screen.getAllByTestId('map')).toHaveLength(2)
    expect(JSON.parse(within(big).getByTestId('map-state').props.children as string).zones).toHaveLength(1)
  })

  it('elegir un punto en el mapa ampliado actualiza la selección y se conserva al cerrar con Listo', async () => {
    const big = await expand()

    await fireEvent.press(within(big).getByLabelText('Elegir punto en mapa'))
    expect(within(big).getByText('-0.20000, -78.50000')).toBeTruthy()
    await fireEvent.press(within(big).getByLabelText('Listo'))

    expect(screen.queryByTestId('expanded-map')).toBeNull()
    expect(screen.getByText('-0.20000, -78.50000')).toBeTruthy()
    expect(JSON.parse(screen.getByTestId('map-state').props.children as string).picked).toEqual({ latitude: -0.2, longitude: -78.5 })
  })

  it('el mapa ampliado se abre centrado en el punto ya elegido', async () => {
    await render(<Harness />)
    await fireEvent.press(screen.getByLabelText('Elegir punto en mapa'))

    await fireEvent.press(screen.getByLabelText('Ampliar mapa'))

    const big = screen.getByTestId('expanded-map')
    expect(JSON.parse(within(big).getByTestId('map-state').props.children as string).focus).toEqual({ latitude: -0.2, longitude: -78.5 })
  })

  it('la X de la cabecera también lo cierra', async () => {
    const big = await expand()

    await fireEvent.press(within(big).getByLabelText('Cerrar mapa ampliado'))

    expect(screen.queryByTestId('expanded-map')).toBeNull()
  })
})
