import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AddressPickerProps } from '@/features/geo/AddressPicker'
import type { Place } from '@/features/geo/photon'
import { ApiError } from '@/shared/api/errors'
import { classifyPoint, listZones } from './api'
import { ZonesPage } from './ZonesPage'
import type { Zone } from './types'

const session = vi.hoisted(() => ({
  user: { role: 'ADMIN' },
  picker: null as AddressPickerProps | null,
}))

vi.mock('@/features/auth/hooks', () => ({
  useCurrentUser: () => ({ data: session.user }),
}))

vi.mock('./api', () => ({
  classifyPoint: vi.fn(),
  listZones: vi.fn(),
}))

// El mapa real necesita un navegador: el selector expone sus props y un botón elige un lugar.
vi.mock('@/features/geo/AddressPicker', async () => {
  const { createElement } = await import('react')
  return {
    AddressPicker: (props: AddressPickerProps) => {
      session.picker = props
      return createElement(
        'button',
        { type: 'button', onClick: () => { props.onChange(placeWithAddress) } },
        'Elegir lugar',
      )
    },
  }
})

vi.mock('./DrawZonePanel', async () => {
  const { createElement } = await import('react')
  return { DrawZonePanel: () => createElement('section', { 'aria-label': 'Panel de dibujo' }, 'Panel de dibujo') }
})

const placeWithAddress: Place = { name: 'Mall del Sol', address: 'Av. Naciones Unidas', latitude: -0.15, longitude: -78.45 }
const placeWithoutAddress: Place = { name: 'Parque Metropolitano', address: '', latitude: -0.17, longitude: -78.47 }

const settings: Zone['settings'] = {
  description: '',
  depotName: 'Hub Norte',
  depotLatitude: -0.179,
  depotLongitude: -78.483,
  maxOrdersPerRoute: 4,
  routeCapacityKg: 45,
  timezone: 'America/Guayaquil',
  serviceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  deliveryWindowFrom: '08:00',
  deliveryWindowTo: '20:00',
  cutoffTime: '14:00',
  dispatchTime: '15:30',
  priority: 'NORMAL',
  dailyOrderLimit: 250,
}

const ring: Zone['ring'] = [
  { latitude: -0.2, longitude: -78.5 },
  { latitude: -0.2, longitude: -78.4 },
  { latitude: -0.1, longitude: -78.4 },
  { latitude: -0.1, longitude: -78.5 },
  { latitude: -0.2, longitude: -78.5 },
]

function buildZone(overrides: Partial<Zone>): Zone {
  return {
    id: 'z-1',
    code: 'CENTRO-001',
    name: 'Centro Histórico',
    ring,
    holes: [],
    status: 'ACTIVE',
    statusReason: '',
    createdAt: '2026-10-10T12:00:00Z',
    settings,
    version: 1,
    updatedAt: '2026-10-10T12:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    ...overrides,
  }
}

const centro = buildZone({})
const norte = buildZone({ id: 'z-2', code: 'NORTE-001', name: 'Norte Comercial', settings: { ...settings, depotName: '' } })

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ZonesPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  session.user = { role: 'ADMIN' }
  session.picker = null
  vi.mocked(listZones).mockReset()
  vi.mocked(classifyPoint).mockReset()
  vi.mocked(listZones).mockResolvedValue([centro, norte])
  vi.mocked(classifyPoint).mockResolvedValue(centro)
})

describe('página de zonas', () => {
  it('a un operador solo le ofrece clasificar, sin selector de modo', () => {
    session.user = { role: 'OPERATOR' }
    renderPage()

    expect(screen.queryByRole('group', { name: 'Modo del mapa' })).not.toBeInTheDocument()
    expect(screen.getByText(/Evalúa si una dirección está cubierta/)).toBeInTheDocument()
  })

  it('al administrador le ofrece cambiar entre clasificar y dibujar', async () => {
    const user = userEvent.setup({ delay: null })
    renderPage()

    const group = screen.getByRole('group', { name: 'Modo del mapa' })
    expect(within(group).getByRole('button', { name: 'Clasificar punto' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(group).getByRole('button', { name: 'Dibujar zona' }))

    expect(screen.getByRole('region', { name: 'Panel de dibujo' })).toBeInTheDocument()
    expect(screen.getByText(/Define el perímetro de cada zona/)).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Dibujar zona' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('volver a clasificar desde el modo dibujo restaura el panel de diagnóstico', async () => {
    const user = userEvent.setup({ delay: null })
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Dibujar zona' }))

    await user.click(screen.getByRole('button', { name: 'Clasificar punto' }))

    expect(screen.queryByRole('region', { name: 'Panel de dibujo' })).not.toBeInTheDocument()
    expect(screen.getByText('Sin punto')).toBeInTheDocument()
  })

  it('sin punto elegido no consulta la clasificación', () => {
    renderPage()

    expect(screen.getByText('Sin punto')).toBeInTheDocument()
    expect(classifyPoint).not.toHaveBeenCalled()
  })

  it('al elegir un lugar clasifica sus coordenadas y muestra la zona que lo cubre', async () => {
    const user = userEvent.setup({ delay: null })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))

    expect(await screen.findByText('COBERTURA VÁLIDA (EN ZONA)')).toBeInTheDocument()
    expect(classifyPoint).toHaveBeenCalledWith({ latitude: -0.15, longitude: -78.45 }, expect.anything())
    expect(screen.getByText('Mall del Sol, Av. Naciones Unidas')).toBeInTheDocument()
  })

  it('un lugar sin dirección muestra solo su nombre', async () => {
    const user = userEvent.setup({ delay: null })
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))
    await screen.findByText('COBERTURA VÁLIDA (EN ZONA)')

    act(() => {
      session.picker?.onChange(placeWithoutAddress)
    })

    expect(await screen.findByText('Parque Metropolitano')).toBeInTheDocument()
  })

  it('muestra "fuera de cobertura" cuando el backend responde 404', async () => {
    vi.mocked(classifyPoint).mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'not found'))
    const user = userEvent.setup({ delay: null })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))

    expect(await screen.findByText('FUERA DE COBERTURA')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('informa del fallo cuando la clasificación falla por otro motivo', async () => {
    vi.mocked(classifyPoint).mockRejectedValue(new ApiError(500, 'INTERNAL', 'boom'))
    const user = userEvent.setup({ delay: null })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos clasificar el punto\./)
  })

  it('mientras llega la respuesta muestra que está clasificando', async () => {
    vi.mocked(classifyPoint).mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup({ delay: null })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))

    expect(await screen.findByText('Clasificando…')).toBeInTheDocument()
  })

  it('pasa al mapa la bodega y la distancia en línea recta de la zona clasificada', async () => {
    const user = userEvent.setup({ delay: null })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))
    await screen.findByText('COBERTURA VÁLIDA (EN ZONA)')

    await waitFor(() => {
      expect(session.picker?.depotName).toBe('Hub Norte')
    })
    expect(session.picker?.depot).toEqual({ latitude: -0.179, longitude: -78.483 })
    expect(session.picker?.depotDistanceLabel).toMatch(/^\d+\.\d km en línea recta$/)
    expect(session.picker?.highlight).toEqual(ring)
    expect(session.picker?.highlightHoles).toEqual([])
  })

  it('una zona sin bodega no dibuja bodega en el mapa', async () => {
    vi.mocked(classifyPoint).mockResolvedValue(norte)
    const user = userEvent.setup({ delay: null })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))
    await screen.findByText('COBERTURA VÁLIDA (EN ZONA)')

    expect(session.picker?.depot).toBeNull()
    expect(session.picker?.depotName).toBeNull()
    expect(session.picker?.depotDistanceLabel).toBeNull()
  })

  it('muestra en la pestaña Zonas el conteo de zonas registradas', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^Zonas/ })).toHaveTextContent(/^Zonas2$/)
    })
  })

  it('al elegir una zona del listado la resalta y la encuadra en el mapa', async () => {
    const user = userEvent.setup({ delay: null })
    renderPage()
    await user.click(await screen.findByRole('tab', { name: /^Zonas/ }))

    await user.click(screen.getByRole('button', { name: /Norte Comercial/ }))

    expect(session.picker?.highlight).toEqual(norte.ring)
    expect(session.picker?.fitBounds).toEqual(norte.ring)
    expect(screen.getByRole('button', { name: /Norte Comercial/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('la zona clasificada queda marcada en el listado', async () => {
    const user = userEvent.setup({ delay: null })
    renderPage()
    await user.click(await screen.findByRole('tab', { name: /^Zonas/ }))
    await user.click(screen.getByRole('tab', { name: 'Diagnóstico' }))
    await user.click(screen.getByRole('button', { name: 'Elegir lugar' }))
    await screen.findByText('COBERTURA VÁLIDA (EN ZONA)')

    await user.click(screen.getByRole('tab', { name: /^Zonas/ }))

    expect(screen.getByRole('button', { name: /Centro Histórico/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('si el listado de zonas falla no muestra conteo ni buscador', async () => {
    vi.mocked(listZones).mockRejectedValue(new ApiError(500, 'INTERNAL', 'boom'))
    const user = userEvent.setup({ delay: null })
    renderPage()

    const tab = await screen.findByRole('tab', { name: 'Zonas' })
    await user.click(tab)

    expect(tab).toHaveTextContent(/^Zonas$/)
    expect(screen.queryByRole('region', { name: 'Zonas de reparto' })).not.toBeInTheDocument()
  })
})
