import { fireEvent, render, screen } from '@testing-library/react-native'

import { StopPicker } from '../src/features/driver-route/StopPicker'
import type { RouteStop } from '../src/features/driver-route/types'

function stop(id: string, address: string): RouteStop {
  return { id, sequence: 1, address, windowStart: '09:00', windowEnd: '12:00', status: 'PENDING', reason: null, latitude: -0.18, longitude: -78.48 }
}

const attended = [stop('o-3', 'Calle Juan Leon 9'), stop('o-1', 'Av. Amazonas 100'), stop('o-2', 'Calle Larga 5')]

describe('StopPicker', () => {
  it('lists every active order in the attend order, with its address', async () => {
    await render(<StopPicker stops={attended} currentId="o-3" onFocus={jest.fn()} onAttend={jest.fn()} />)

    expect(screen.getByText('Calle Juan Leon 9')).toBeTruthy()
    expect(screen.getByText('Av. Amazonas 100')).toBeTruthy()
    expect(screen.getByText('Calle Larga 5')).toBeTruthy()
  })

  it('marks the order being attended first', async () => {
    await render(<StopPicker stops={attended} currentId="o-3" onFocus={jest.fn()} onAttend={jest.fn()} />)

    expect(screen.getByText('Atendiendo ahora')).toBeTruthy()
  })

  it('lets the driver re-center the map on one order', async () => {
    const onFocus = jest.fn()
    await render(<StopPicker stops={attended} currentId="o-3" onFocus={onFocus} onAttend={jest.fn()} />)

    fireEvent.press(screen.getByLabelText('Ver Av. Amazonas 100 en el mapa'))

    expect(onFocus).toHaveBeenCalledWith('o-1')
  })

  it('lets the driver choose which order to attend first, for orders that are not current', async () => {
    const onAttend = jest.fn()
    await render(<StopPicker stops={attended} currentId="o-3" onFocus={jest.fn()} onAttend={onAttend} />)

    expect(screen.queryByLabelText('Atender primero Calle Juan Leon 9')).toBeNull()
    fireEvent.press(screen.getByLabelText('Atender primero Calle Larga 5'))

    expect(onAttend).toHaveBeenCalledWith('o-2')
  })
})


