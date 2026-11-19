import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reverseStreetPlace, searchPlaces } from './api'
import { AddressPicker } from './AddressPicker'
import type { Place } from './photon'

vi.mock('./api', () => ({
  reverseStreetPlace: vi.fn(),
  searchPlaces: vi.fn(),
}))

// El mapa real necesita un navegador: aquí un nodo expone el punto enfocado y el elegido, y un botón emite un clic.
vi.mock('./LazyMapCanvas', async () => {
  const { createElement } = await import('react')
  return {
    LazyMapCanvas: (props: {
      focus?: { latitude: number; longitude: number } | null
      picked?: { latitude: number; longitude: number } | null
      onMapClick: (point: { latitude: number; longitude: number }) => void
    }) =>
      createElement(
        'div',
        {
          'data-testid': 'map',
          'data-focus': props.focus ? `${String(props.focus.latitude)},${String(props.focus.longitude)}` : '',
          'data-picked': props.picked ? `${String(props.picked.latitude)},${String(props.picked.longitude)}` : '',
        },
        createElement(
          'button',
          { type: 'button', onClick: () => { props.onMapClick({ latitude: -0.2, longitude: -78.5 }) } },
          'Elegir punto',
        ),
      ),
  }
})

const amazonas: Place = { name: 'Av. Amazonas', address: 'Quito, Ecuador', latitude: -0.18, longitude: -78.48 }

function Harness({ initial = null }: { initial?: Place | null }) {
  const [value, setValue] = useState<Place | null>(initial)
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AddressPicker value={value} onChange={setValue} expandable />
    </QueryClientProvider>
  )
}

const nameInput = () => screen.getByLabelText('Nombre del lugar')

beforeEach(() => {
  vi.mocked(searchPlaces).mockReset()
  vi.mocked(searchPlaces).mockResolvedValue([])
  vi.mocked(reverseStreetPlace).mockReset()
  vi.mocked(reverseStreetPlace).mockResolvedValue(null)
})

describe('selector de dirección: búsqueda y selección', () => {
  it('elegir un resultado de la búsqueda lo selecciona, centra el mapa y muestra su nombre y coordenadas', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([amazonas])
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), 'Amazonas')
    await user.click(await screen.findByRole('button', { name: /Av\. Amazonas/ }))

    expect(nameInput()).toHaveValue('Av. Amazonas')
    expect(screen.getByText('Quito, Ecuador')).toBeInTheDocument()
    expect(screen.getByText('-0.18000, -78.48000')).toBeInTheDocument()
    expect(screen.getByTestId('map')).toHaveAttribute('data-focus', '-0.18,-78.48')
    expect(screen.getByTestId('map')).toHaveAttribute('data-picked', '-0.18,-78.48')
  })

  it('editar el nombre actualiza el lugar elegido', async () => {
    const user = userEvent.setup()
    render(<Harness initial={amazonas} />)

    await user.clear(nameInput())
    await user.type(nameInput(), 'Casa')

    expect(nameInput()).toHaveValue('Casa')
  })

  it('Quitar selección borra el punto y oculta la sección de datos', async () => {
    const user = userEvent.setup()
    render(<Harness initial={amazonas} />)

    await user.click(screen.getByRole('button', { name: 'Quitar selección' }))

    expect(screen.queryByLabelText('Nombre del lugar')).toBeNull()
    expect(screen.getByTestId('map')).toHaveAttribute('data-picked', '')
  })
})

describe('selector de dirección: dirección del clic en el mapa', () => {
  it('mientras se busca la calle muestra el aviso y, al llegar, conserva las coordenadas exactas del clic', async () => {
    let resolve: (place: Place) => void = () => undefined
    vi.mocked(reverseStreetPlace).mockReturnValue(new Promise<Place>((r) => { resolve = r }))
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Elegir punto' }))
    expect(screen.getByText('Buscando dirección…')).toBeInTheDocument()

    resolve({ name: 'Av. Amazonas', address: 'Av. Amazonas, Quito', latitude: -0.5, longitude: -79 })
    expect(await screen.findByText('Av. Amazonas, Quito')).toBeInTheDocument()
    expect(screen.getByText('-0.20000, -78.50000')).toBeInTheDocument()
    expect(screen.getByTestId('map')).toHaveAttribute('data-picked', '-0.2,-78.5')
  })

  it('sin calles cercanas deja el punto sin nombre y lo indica', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Elegir punto' }))

    expect(await screen.findByText(/Sin dirección disponible para este punto/)).toBeInTheDocument()
    expect(nameInput()).toHaveValue('')
  })

  it('si la búsqueda de la calle falla, termina la espera y mantiene el punto', async () => {
    vi.mocked(reverseStreetPlace).mockRejectedValue(new Error('timeout'))
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Elegir punto' }))

    expect(await screen.findByText(/Sin dirección disponible para este punto/)).toBeInTheDocument()
    expect(screen.queryByText('Buscando dirección…')).toBeNull()
    expect(screen.getByTestId('map')).toHaveAttribute('data-picked', '-0.2,-78.5')
  })
})

describe('selector de dirección: mapa ampliado', () => {
  it('elegir un resultado de la búsqueda dentro del mapa ampliado actualiza la selección', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([amazonas])
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Ampliar mapa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Mapa ampliado' })

    await user.type(within(dialog).getByRole('textbox', { name: 'Buscar calle o lugar' }), 'Amazonas')
    await user.click(await within(dialog).findByRole('button', { name: /Av\. Amazonas/ }))

    expect(nameInput()).toHaveValue('Av. Amazonas')
    expect(within(dialog).getByTestId('map')).toHaveAttribute('data-focus', '-0.18,-78.48')
  })
})
