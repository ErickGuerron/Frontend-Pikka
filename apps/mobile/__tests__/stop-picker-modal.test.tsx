import { fireEvent, render, screen } from '@testing-library/react-native'

import { StopPickerModal } from '../src/features/driver-route/StopPickerModal'
import type { RouteStop } from '../src/features/driver-route/types'

function stop(id: string, over: Partial<RouteStop> = {}): RouteStop {
  return { id, sequence: 1, address: id, windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null, latitude: -0.18, longitude: -78.48, ...over }
}

const driver = { latitude: -0.18, longitude: -78.48 }
const few = [stop('Calle Juan Leon 9'), stop('Av. Amazonas 100'), stop('Calle Larga 5')]
const many = Array.from({ length: 12 }, (_, i) => stop(`Pedido ${String(i + 1)}`))

async function renderModal(stops: RouteStop[], over: Partial<Parameters<typeof StopPickerModal>[0]> = {}) {
  const props = { visible: true, stops, currentId: stops[0]?.id, driver, onClose: jest.fn(), onFocus: jest.fn(), onAttend: jest.fn(), ...over }
  await render(<StopPickerModal {...props} />)
  return { props }
}

describe('StopPickerModal', () => {
  it('lists the active orders with their window and marks the one being attended', async () => {
    await renderModal(few)

    expect(screen.getByText('Av. Amazonas 100')).toBeTruthy()
    expect(screen.getAllByText(/09:00–12:00/).length).toBe(3)
    expect(screen.getByText('Atendiendo ahora')).toBeTruthy()
  })

  it('shows 5 orders per page and pages through the rest', async () => {
    await renderModal(many)

    expect(screen.getByText('Página 1 de 3')).toBeTruthy()
    expect(screen.queryByText('Pedido 6')).toBeNull()
    await fireEvent.press(screen.getByLabelText('Página siguiente'))
    expect(screen.getByText('Página 2 de 3')).toBeTruthy()
    expect(screen.getByText('Pedido 6')).toBeTruthy()
    expect(screen.queryByText('Pedido 1')).toBeNull()
  })

  it('sorts by the closest order to the driver', async () => {
    const far = stop('Lejos', { latitude: -0.3, longitude: -78.6 })
    const near = stop('Cerca', { latitude: -0.1801, longitude: -78.4801 })
    await renderModal([far, near])

    await fireEvent.press(screen.getByLabelText('Ordenar por Más cercanas'))

    const text = screen.getAllByText(/^(Lejos|Cerca)$/).map((n) => n.props.children)
    expect(text).toEqual(['Cerca', 'Lejos'])
  })

  it('disables "Más cercanas" while the driver position is unknown', async () => {
    await renderModal(few, { driver: null })

    expect(screen.getByLabelText('Ordenar por Más cercanas').props.accessibilityState).toMatchObject({ disabled: true })
  })

  it('centers the map on the chosen order and closes', async () => {
    const { props } = await renderModal(few)

    await fireEvent.press(screen.getByLabelText('Ver Av. Amazonas 100 en el mapa'))

    expect(props.onFocus).toHaveBeenCalledWith('Av. Amazonas 100')
    expect(props.onClose).toHaveBeenCalled()
  })

  it('lets the driver attend an order first, but not the current one', async () => {
    const { props } = await renderModal(few)

    expect(screen.queryByLabelText('Atender primero Calle Juan Leon 9')).toBeNull()
    await fireEvent.press(screen.getByLabelText('Atender primero Calle Larga 5'))

    expect(props.onAttend).toHaveBeenCalledWith('Calle Larga 5')
  })
})
