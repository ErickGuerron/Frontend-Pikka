import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchPlaces } from './api'
import { PlaceSearch } from './PlaceSearch'
import type { Place } from './photon'

vi.mock('./api', () => ({ searchPlaces: vi.fn() }))

const amazonas: Place = { name: 'Av. Amazonas', address: 'Quito, Ecuador', latitude: -0.18, longitude: -78.48 }
const sinDireccion: Place = { name: 'Parque Carolina', address: '', latitude: -0.19, longitude: -78.48 }

function renderSearch(onSelect = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <PlaceSearch onSelect={onSelect} />
    </QueryClientProvider>,
  )
  return { onSelect }
}

beforeEach(() => {
  vi.mocked(searchPlaces).mockReset()
  vi.mocked(searchPlaces).mockResolvedValue([])
})

describe('buscador de calles y lugares', () => {
  it('pide al menos 3 letras antes de buscar', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), 'Av')

    expect(screen.getByText('Escribe al menos 3 letras.')).toBeInTheDocument()
    expect(searchPlaces).not.toHaveBeenCalled()
  })

  it('busca tras la pausa de escritura y muestra cada resultado con su dirección', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([amazonas, sinDireccion])
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), 'Ama')

    expect(await screen.findByRole('button', { name: /Av\. Amazonas/ })).toHaveTextContent('Quito, Ecuador')
    expect(screen.getByRole('button', { name: /Parque Carolina/ })).toBeInTheDocument()
    expect(vi.mocked(searchPlaces).mock.calls[0]?.[0]).toBe('Ama')
  })

  it('al elegir un resultado lo entrega a onSelect y vacía el buscador', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([amazonas])
    const user = userEvent.setup()
    const { onSelect } = renderSearch()
    const input = screen.getByRole('textbox', { name: 'Buscar calle o lugar' })

    await user.type(input, 'Amazonas')
    await user.click(await screen.findByRole('button', { name: /Av\. Amazonas/ }))

    expect(onSelect).toHaveBeenCalledWith(amazonas)
    expect(input).toHaveValue('')
    expect(screen.queryByRole('button', { name: /Av\. Amazonas/ })).toBeNull()
  })

  it('un resultado sin dirección no muestra línea de dirección', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([sinDireccion])
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), 'Carolina')

    const button = await screen.findByRole('button', { name: /Parque Carolina/ })
    expect(button.querySelectorAll('span')).toHaveLength(1)
  })

  it('mientras busca muestra el aviso de espera', async () => {
    vi.mocked(searchPlaces).mockReturnValue(new Promise<Place[]>(() => undefined))
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), 'Quito')

    expect(await screen.findByText('Buscando…')).toBeInTheDocument()
  })

  it('si la búsqueda falla lo dice con una alerta', async () => {
    vi.mocked(searchPlaces).mockRejectedValue(new Error('timeout'))
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), 'Quito')

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo buscar en este momento. Intenta de nuevo.')
  })

  it('sin coincidencias lo indica', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), 'zzzzz')

    expect(await screen.findByText('Sin resultados.')).toBeInTheDocument()
  })

  it('el botón Limpiar búsqueda aparece con texto y borra la consulta', async () => {
    const user = userEvent.setup()
    renderSearch()
    const input = screen.getByRole('textbox', { name: 'Buscar calle o lugar' })
    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).toBeNull()

    await user.type(input, 'Quito')
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))

    expect(input).toHaveValue('')
    await waitFor(() => { expect(screen.queryByText('Escribe al menos 3 letras.')).toBeNull() })
  })

  it('una consulta de espacios no dispara búsqueda', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('textbox', { name: 'Buscar calle o lugar' }), '   ')

    expect(screen.queryByText('Escribe al menos 3 letras.')).toBeNull()
    expect(searchPlaces).not.toHaveBeenCalled()
  })
})
