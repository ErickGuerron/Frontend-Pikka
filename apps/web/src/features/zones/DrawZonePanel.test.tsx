import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MapCanvasProps } from '@/features/geo/MapCanvas'
import type { PlaceSearchProps } from '@/features/geo/PlaceSearch'
import type { Place } from '@/features/geo/photon'
import type { Coordinate } from '@/features/geo/types'
import { ApiError } from '@/shared/api/errors'
import { createZone, listZones, updateZone } from './api'
import { DrawZonePanel } from './DrawZonePanel'
import { buildZone } from './zones.fixtures'
import { renderWithQueryClient, startRedrawFromList } from './zones.test-utils'
import type { Zone } from './types'

// El mapa de Leaflet necesita un navegador: el mock guarda las props que recibe para que cada prueba
// dispare clics y eventos del mapa, y comprueba lo que se le pasa.
const canvas = vi.hoisted(() => ({ props: null as MapCanvasProps | null }))

vi.mock('@/features/geo/LazyMapCanvas', async () => {
  const { createElement } = await import('react')
  return {
    LazyMapCanvas: (props: MapCanvasProps) => {
      canvas.props = props
      return createElement('div', { 'data-testid': 'map' })
    },
  }
})

vi.mock('@/features/geo/PlaceSearch', async () => {
  const { createElement } = await import('react')
  return {
    PlaceSearch: (props: PlaceSearchProps) =>
      createElement('button', { type: 'button', onClick: () => { props.onSelect(foundPlace) } }, 'Buscar lugar de prueba'),
  }
})

vi.mock('./api', () => ({
  classifyPoint: vi.fn(),
  createZone: vi.fn(),
  deleteZone: vi.fn(),
  getZone: vi.fn(),
  listZones: vi.fn(),
  setZoneStatus: vi.fn(),
  updateZone: vi.fn(),
}))

const foundPlace: Place = { name: 'Av. Amazonas', address: 'Quito', latitude: -0.18, longitude: -78.48 }

// Cuadrado de referencia dentro de Quito: SW, SE, NE, NW.
const SW: Coordinate = { latitude: -0.2, longitude: -78.5 }
const SE: Coordinate = { latitude: -0.2, longitude: -78.4 }
const NE: Coordinate = { latitude: -0.1, longitude: -78.4 }
const NW: Coordinate = { latitude: -0.1, longitude: -78.5 }
// Quinto vértice que vuelve convexo el pentágono.
const EAST: Coordinate = { latitude: -0.15, longitude: -78.35 }
// Hueco dentro del cuadrado y otro que lo pisa.
const HOLE_A: Coordinate[] = [
  { latitude: -0.18, longitude: -78.48 },
  { latitude: -0.18, longitude: -78.42 },
  { latitude: -0.12, longitude: -78.42 },
  { latitude: -0.12, longitude: -78.48 },
]
const HOLE_OVERLAP: Coordinate[] = [
  { latitude: -0.17, longitude: -78.47 },
  { latitude: -0.17, longitude: -78.45 },
  { latitude: -0.15, longitude: -78.45 },
  { latitude: -0.15, longitude: -78.47 },
]
const OUTSIDE: Coordinate[] = [
  { latitude: -0.3, longitude: -78.6 },
  { latitude: -0.3, longitude: -78.55 },
  { latitude: -0.25, longitude: -78.55 },
  { latitude: -0.25, longitude: -78.6 },
]

const closedSquare: Coordinate[] = [SW, SE, NE, NW, SW]
const closedHole: Coordinate[] = [...HOLE_A, HOLE_A[0] ?? SW]

// Zona registrada de referencia: el anillo es el cuadrado de zones.fixtures, con un hueco y versión 3.
function zoneFixture(overrides: Partial<Zone> = {}): Zone {
  return buildZone({ holes: [closedHole], version: 3, ...overrides })
}

function renderPanel() {
  renderWithQueryClient(<DrawZonePanel />)
}

/** Redibuja la zona y guarda con un 409: deja visible el aviso de conflicto de versión. */
async function saveWithVersionConflict(user: UserEvent) {
  vi.mocked(listZones).mockResolvedValue([zoneFixture()])
  vi.mocked(updateZone).mockRejectedValue(new ApiError(409, 'CONFLICT', 'version'))
  renderPanel()
  await startRedrawFromList(user)
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await screen.findByRole('alert')
}

function map(): MapCanvasProps {
  if (canvas.props === null) throw new Error('El mapa no se ha renderizado')
  return canvas.props
}

function clickMap(...points: Coordinate[]) {
  for (const point of points) {
    act(() => {
      map().onMapClick(point)
    })
  }
}

const TOOL_ADD = 'Agregar vértice (1): clic en el mapa'
const TOOL_ERASE = 'Quitar vértice (3): clic sobre el vértice'
const TOOL_DEPOT = 'Fijar bodega de salida (4): clic en el mapa'
const TOOL_HOLE = 'Dibujar exclusión (2)'
const START_HOLE = 'Agregar exclusión (hole)'
const DEFAULT_HINT = /Busca una calle o lugar/

const nameField = () => screen.getByPlaceholderText('Ej. Hipercentro Financiero')
const depotNameField = () => screen.getByPlaceholderText('Ej. Hub Norte')
const latitudeField = () => screen.getByPlaceholderText('Ej. -0.179000')
const longitudeField = () => screen.getByPlaceholderText('Ej. -78.483000')

async function fillValidZone(user: ReturnType<typeof userEvent.setup>) {
  await user.type(nameField(), 'Hipercentro Financiero')
  clickMap(SW, SE, NE, NW)
  await user.type(depotNameField(), 'Hub Norte')
  await user.type(latitudeField(), '-0.179')
  await user.type(longitudeField(), '-78.483')
}

beforeEach(() => {
  canvas.props = null
  vi.mocked(listZones).mockReset()
  vi.mocked(createZone).mockReset()
  vi.mocked(updateZone).mockReset()
  vi.mocked(listZones).mockResolvedValue([])
})

describe('lienzo de trazado', () => {
  it('empieza con la zona vacía, sin área y en modo polígono exterior', () => {
    renderPanel()

    expect(screen.getByText('Modo polígono · exterior')).toBeInTheDocument()
    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()
    expect(screen.getByText('0 exclusiones (hole)')).toBeInTheDocument()
    expect(screen.getByText('área pendiente')).toBeInTheDocument()
  })

  it('cada clic con la herramienta agregar suma un vértice y calcula el área', () => {
    renderPanel()

    clickMap(SW, SE, NE, NW)

    expect(screen.getByText('4 vértices exterior')).toBeInTheDocument()
    expect(screen.getByText(/^\d+\.\d{2} km²$/)).toBeInTheDocument()
  })

  it('un punto repetido no duplica el vértice', () => {
    renderPanel()

    clickMap(SW, SW)

    expect(screen.getByText('1 vértices exterior')).toBeInTheDocument()
  })

  it('con la herramienta quitar, un clic en el mapa no agrega nada', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.click(screen.getByRole('button', { name: TOOL_ERASE }))
    clickMap(SW)

    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()
    expect(screen.getByText(/Herramienta quitar activa/)).toBeInTheDocument()
  })

  it('con la herramienta quitar, un clic sobre un vértice lo elimina', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: TOOL_ERASE }))

    act(() => {
      map().onVertexClick?.(SW)
    })

    expect(screen.getByText('3 vértices exterior')).toBeInTheDocument()
  })

  it('solo la herramienta quitar ofrece clic sobre un vértice', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    expect(map().onVertexClick).toBeUndefined()

    await user.click(screen.getByRole('button', { name: TOOL_ERASE }))

    expect(map().onVertexClick).toBeDefined()
  })

  it('el botón de quitar vértice del mapa elimina el punto que el mapa señala', () => {
    renderPanel()
    clickMap(SW, SE, NE, NW)

    act(() => {
      map().onVertexRemove?.(NE)
    })

    expect(screen.getByText('3 vértices exterior')).toBeInTheDocument()
  })

  it('con la herramienta bodega, un clic fija la bodega y rellena sus coordenadas', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.click(screen.getByRole('button', { name: TOOL_DEPOT }))
    clickMap({ latitude: -0.15, longitude: -78.45 })

    expect(latitudeField()).toHaveValue('-0.150000')
    expect(longitudeField()).toHaveValue('-78.450000')
    expect(map().depot).toEqual({ latitude: -0.15, longitude: -78.45 })
    expect(screen.getByText(/Herramienta bodega activa/)).toBeInTheDocument()
  })

  it('deshacer una fijación de bodega devuelve los campos a su valor anterior', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    await user.click(screen.getByRole('button', { name: TOOL_DEPOT }))
    clickMap({ latitude: -0.15, longitude: -78.45 })

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))

    expect(latitudeField()).toHaveValue('')
    expect(longitudeField()).toHaveValue('')
    expect(map().depot).toBeNull()
  })

  it('deshacer quita el último trazo y no va más allá del estado inicial', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    const undo = screen.getByRole('button', { name: 'Deshacer' })
    expect(undo).toBeDisabled()
    clickMap(SW, SE)

    await user.click(undo)

    expect(screen.getByText('1 vértices exterior')).toBeInTheDocument()
    await user.click(undo)
    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()
    expect(undo).toBeDisabled()
  })

  it('la herramienta borrar trazo vacía el anillo en edición y es deshacible', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE)

    await user.click(screen.getByRole('button', { name: 'Borrar trazo actual (Esc)' }))
    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(screen.getByText('3 vértices exterior')).toBeInTheDocument()
  })

  it('encuadrar pide al mapa los vértices activos, y sin vértices no hace nada', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    expect(screen.getByRole('button', { name: 'Centrar en la figura (F)' })).toBeDisabled()

    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: 'Centrar en la figura (F)' }))

    expect(map().fitBounds).toHaveLength(4)
  })

  it('elegir un lugar en la búsqueda centra el mapa sin marcar ningún punto', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'Buscar lugar de prueba' }))

    expect(map().focus).toEqual({ latitude: -0.18, longitude: -78.48 })
    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()
  })

  it('la pista explica el trazo por defecto y cambia con la herramienta activa', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    expect(screen.getByText(DEFAULT_HINT)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: TOOL_ERASE }))
    expect(screen.getByText(/Herramienta quitar activa/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: TOOL_ADD }))
    expect(screen.getByText(DEFAULT_HINT)).toBeInTheDocument()
  })
})

describe('exclusiones (huecos)', () => {
  it('no permite empezar un hueco antes de tener un perímetro válido', () => {
    renderPanel()

    expect(screen.getByRole('button', { name: START_HOLE })).toBeDisabled()
  })

  it('dibuja un hueco dentro de la zona y lo confirma en la lista', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)

    await user.click(screen.getByRole('button', { name: START_HOLE }))
    expect(screen.getByText('Modo polígono · hueco')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terminar hueco' })).toBeDisabled()
    expect(map().reference).toHaveLength(4)

    clickMap(...HOLE_A)
    await user.click(screen.getByRole('button', { name: 'Terminar hueco' }))

    expect(screen.getByText('1 exclusión (hole)')).toBeInTheDocument()
    expect(screen.getByText('Hueco 1 · 4 vértices')).toBeInTheDocument()
    expect(map().holes).toHaveLength(1)
    expect(map().reference).toBeNull()
  })

  it('avisa cuando el hueco tiene menos de cuatro vértices', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: START_HOLE }))

    clickMap(HOLE_A[0] ?? SW, HOLE_A[1] ?? SW, HOLE_A[2] ?? SW)

    expect(screen.getByText('Necesitas al menos 4 vértices para formar la zona.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terminar hueco' })).toBeDisabled()
  })

  it('rechaza un hueco que se sale del perímetro', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: START_HOLE }))

    clickMap(...OUTSIDE)

    expect(screen.getByText('El hueco debe quedar completamente dentro de la zona, sin tocar su borde.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terminar hueco' })).toBeDisabled()
  })

  it('rechaza un hueco que se superpone con otro ya dibujado', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: START_HOLE }))
    clickMap(...HOLE_A)
    await user.click(screen.getByRole('button', { name: 'Terminar hueco' }))
    await user.click(screen.getByRole('button', { name: START_HOLE }))

    clickMap(...HOLE_OVERLAP)

    expect(screen.getByText('El hueco no puede superponerse ni tocar otro hueco.')).toBeInTheDocument()
  })

  it('cancelar el hueco descarta sus puntos y vuelve al exterior', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: START_HOLE }))
    clickMap(...HOLE_A)

    await user.click(screen.getByRole('button', { name: 'Cancelar hueco' }))

    expect(screen.getByText('Modo polígono · exterior')).toBeInTheDocument()
    expect(screen.getByText('0 exclusiones (hole)')).toBeInTheDocument()
    expect(screen.getByText('4 vértices exterior')).toBeInTheDocument()
  })

  it('quitar un hueco guardado lo elimina de la zona', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: START_HOLE }))
    clickMap(...HOLE_A)
    await user.click(screen.getByRole('button', { name: 'Terminar hueco' }))

    await user.click(screen.getByRole('button', { name: 'Quitar hueco 1' }))

    expect(screen.getByText('0 exclusiones (hole)')).toBeInTheDocument()
    expect(map().holes).toHaveLength(0)
  })

  it('elegir agregar vértice mientras se dibuja un hueco cancela el hueco', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.click(screen.getByRole('button', { name: START_HOLE }))

    await user.click(screen.getByRole('button', { name: TOOL_ADD }))

    expect(screen.getByText('Modo polígono · exterior')).toBeInTheDocument()
  })

  it('la tecla 2 abre y cierra el modo hueco y vuelve a la herramienta agregar', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)

    await user.keyboard('2')
    expect(screen.getByText('Modo polígono · hueco')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: TOOL_HOLE })).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('2')
    expect(screen.getByText('Modo polígono · exterior')).toBeInTheDocument()
  })
})

describe('vértices de la figura', () => {
  it('lista los primeros cuatro vértices con su acción de quitar', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)

    expect(screen.getByRole('button', { name: 'Quitar vértice V-04' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar vértice V-01' }))

    expect(screen.getByText('3 vértices exterior')).toBeInTheDocument()
  })

  it('con más de cuatro vértices abre el listado completo y permite quitar desde ahí', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, EAST, NE, NW)

    await user.click(screen.getByRole('button', { name: 'Ver todos los vértices (5)' }))
    const dialog = screen.getByRole('dialog', { name: 'Vértices del exterior' })
    await user.click(dialogButton(dialog, 'Quitar vértice V-01 del listado'))

    expect(screen.getByText('4 vértices exterior')).toBeInTheDocument()
    await user.click(dialogButton(dialog, 'Listo'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape cierra el listado de vértices sin borrar el trazo', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, EAST, NE, NW)
    await user.click(screen.getByRole('button', { name: 'Ver todos los vértices (5)' }))

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('5 vértices exterior')).toBeInTheDocument()
  })
})

describe('atajos de teclado', () => {
  it('Retroceso y Supr quitan el último vértice', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)

    await user.keyboard('{Backspace}')
    expect(screen.getByText('3 vértices exterior')).toBeInTheDocument()

    await user.keyboard('{Delete}')
    expect(screen.getByText('2 vértices exterior')).toBeInTheDocument()
  })

  it('Escape limpia el anillo en edición y no hace nada si está vacío', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.keyboard('{Escape}')
    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()

    clickMap(SW, SE, NE, NW)
    await user.keyboard('{Escape}')
    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()
  })

  it('Escape durante un hueco cancela el hueco', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.keyboard('2')
    clickMap(...HOLE_A)

    await user.keyboard('{Escape}')

    expect(screen.getByText('Modo polígono · exterior')).toBeInTheDocument()
    expect(screen.getByText('4 vértices exterior')).toBeInTheDocument()
  })

  it('Ctrl+Z deshace la última acción, también con Cmd', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE)

    await user.keyboard('{Control>}z{/Control}')
    expect(screen.getByText('2 vértices exterior')).toBeInTheDocument()

    await user.keyboard('{Meta>}z{/Meta}')
    expect(screen.getByText('1 vértices exterior')).toBeInTheDocument()
  })

  it('Ctrl+Z sin historial no cambia nada', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.keyboard('{Control>}z{/Control}')

    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()
  })

  it('las teclas 3 y 4 cambian de herramienta y F encuadra la figura', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)

    await user.keyboard('3')
    expect(screen.getByText(/Herramienta quitar activa/)).toBeInTheDocument()

    await user.keyboard('4')
    expect(screen.getByText(/Herramienta bodega activa/)).toBeInTheDocument()

    await user.keyboard('f')
    expect(map().fitBounds).toHaveLength(4)
  })

  it('la tecla 1 vuelve a agregar vértices y sale del modo hueco', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    clickMap(SW, SE, NE, NW)
    await user.keyboard('3')
    expect(screen.getByText(/Herramienta quitar activa/)).toBeInTheDocument()

    await user.keyboard('1')
    expect(screen.getByText(DEFAULT_HINT)).toBeInTheDocument()

    await user.keyboard('2')
    await user.keyboard('1')
    expect(screen.getByText('Modo polígono · exterior')).toBeInTheDocument()
  })

  it('ignora las combinaciones con Ctrl que no son deshacer', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.keyboard('{Control>}4{/Control}')

    expect(screen.getByText(DEFAULT_HINT)).toBeInTheDocument()
  })

  it('no interpreta los atajos mientras el usuario escribe el nombre', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.type(nameField(), '2')

    expect(nameField()).toHaveValue('2')
    expect(screen.getByText('Modo polígono · exterior')).toBeInTheDocument()
  })

  it('los atajos también llegan cuando el foco está en el propio ventana', () => {
    renderPanel()

    fireEvent.keyDown(window, { key: '3' })

    expect(screen.getByText(/Herramienta quitar activa/)).toBeInTheDocument()
  })

  it('una tecla sin atajo no cambia el trazo', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.keyboard('x')

    expect(screen.getByText('0 vértices exterior')).toBeInTheDocument()
  })
})

describe('redibujar una zona registrada', () => {
  it('carga la zona en el editor con su perímetro, huecos y configuración', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(listZones).mockResolvedValue([zoneFixture({ statusReason: 'Reactivada por operaciones' })])
    renderPanel()

    await startRedrawFromList(user)

    expect(screen.getByText('Redibujando CENTRO-001')).toBeInTheDocument()
    expect(nameField()).toHaveValue('Centro Histórico')
    expect(screen.getByText('4 vértices exterior')).toBeInTheDocument()
    expect(screen.getByText('1 exclusión (hole)')).toBeInTheDocument()
    expect(screen.getByText('ACTIVA')).toBeInTheDocument()
    expect(screen.getByText('Último motivo de estado: Reactivada por operaciones')).toBeInTheDocument()
    expect(depotNameField()).toHaveValue('Hub Norte')
    expect(map().fitBounds).toEqual(closedSquare)
  })

  it('ver una zona la resalta en el mapa sin entrar al modo edición', async () => {
    const user = userEvent.setup({ delay: null })
    const zone = zoneFixture()
    vi.mocked(listZones).mockResolvedValue([zone])
    renderPanel()
    await user.click(screen.getByRole('tab', { name: /Zonas registradas/ }))

    await user.click(await screen.findByRole('button', { name: 'Ver CENTRO-001 en el mapa' }))

    expect(map().highlight).toEqual(zone.ring)
    expect(map().highlightHoles).toEqual(zone.holes)
    expect(screen.getByRole('button', { name: 'Redibujar CENTRO-001' })).toBeInTheDocument()
  })

  it('cancelar el redibujo vuelve a una zona nueva en blanco', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(listZones).mockResolvedValue([zoneFixture()])
    renderPanel()
    await startRedrawFromList(user)

    await user.click(screen.getByRole('button', { name: 'Cancelar redibujo' }))

    expect(screen.getByText('Nueva zona')).toBeInTheDocument()
    expect(nameField()).toHaveValue('')
  })

  it('guardar los cambios envía la versión que el usuario vio', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(listZones).mockResolvedValue([zoneFixture()])
    vi.mocked(updateZone).mockResolvedValue(zoneFixture({ name: 'Centro Histórico Norte', version: 4 }))
    renderPanel()
    await startRedrawFromList(user)
    await user.type(nameField(), ' Norte')

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Zona CENTRO-001 actualizada.')
    expect(updateZone).toHaveBeenCalledWith('z-1', expect.objectContaining({ name: 'Centro Histórico Norte', expectedVersion: 3 }))
  })

  it('si otra persona cambió la zona, ofrece recargarla y reemplaza el editor', async () => {
    const user = userEvent.setup({ delay: null })
    await saveWithVersionConflict(user)
    expect(screen.getByRole('alert')).toHaveTextContent('Otra persona modificó esta zona mientras la editabas.')

    vi.mocked(listZones).mockResolvedValueOnce([zoneFixture({ name: 'Centro Nuevo', version: 4 })])
    await user.click(screen.getByRole('button', { name: 'Recargar zona' }))

    expect(await screen.findByDisplayValue('Centro Nuevo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si la recarga tras el conflicto falla, lo informa', async () => {
    const user = userEvent.setup({ delay: null })
    await saveWithVersionConflict(user)

    vi.mocked(listZones).mockRejectedValueOnce(new ApiError(500, 'INTERNAL', 'boom'))
    await user.click(screen.getByRole('button', { name: 'Recargar zona' }))

    expect(await screen.findByText(/No pudimos recargar la zona\./)).toBeInTheDocument()
  })

  it('si la zona ya no existe al recargar, sale del modo redibujo', async () => {
    const user = userEvent.setup({ delay: null })
    await saveWithVersionConflict(user)

    vi.mocked(listZones).mockResolvedValueOnce([])
    await user.click(screen.getByRole('button', { name: 'Recargar zona' }))

    expect(await screen.findByText('Nueva zona')).toBeInTheDocument()
  })

  it('si la zona quedó inactiva mientras se editaba, la recarga la muestra como inactiva', async () => {
    const user = userEvent.setup({ delay: null })
    await saveWithVersionConflict(user)

    vi.mocked(listZones).mockResolvedValueOnce([zoneFixture({ status: 'INACTIVE', statusReason: 'Sin cobertura' })])
    await user.click(screen.getByRole('button', { name: 'Recargar zona' }))

    expect(await screen.findByText('INACTIVA')).toBeInTheDocument()
  })
})

describe('guardar una zona nueva', () => {
  it('no permite guardar hasta que nombre, perímetro y bodega estén completos', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    expect(screen.getByRole('button', { name: 'Guardar zona' })).toBeDisabled()

    await fillValidZone(user)

    expect(screen.getByRole('button', { name: 'Guardar zona' })).toBeEnabled()
  })

  it('envía la zona con su código pendiente y confirma el guardado', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(createZone).mockResolvedValue(zoneFixture({ id: 'z-9', code: 'HIPERC-001', name: 'Hipercentro Financiero', holes: [] }))
    renderPanel()
    await fillValidZone(user)

    await user.click(screen.getByRole('button', { name: 'Guardar zona' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Zona HIPERC-001 guardada.')
    const draft = vi.mocked(createZone).mock.calls[0]?.[0]
    const ring = draft?.ring ?? []
    expect(ring).toHaveLength(5)
    expect(ring[0]).toEqual(ring[4])
    expect(draft).toMatchObject({
      name: 'Hipercentro Financiero',
      holes: [],
      settings: { depotName: 'Hub Norte', depotLatitude: -0.179, depotLongitude: -78.483, dailyOrderLimit: 250 },
    })
    expect(nameField()).toHaveValue('')
  })

  it('muestra "Guardando…" mientras espera al servidor', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(createZone).mockReturnValue(new Promise(() => undefined))
    renderPanel()
    await fillValidZone(user)

    await user.click(screen.getByRole('button', { name: 'Guardar zona' }))

    expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled()
  })

  it('si el servidor rechaza la zona, muestra el motivo del rechazo', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(createZone).mockRejectedValue(new ApiError(400, 'INVALID_ARGUMENT', 'ring'))
    renderPanel()
    await fillValidZone(user)

    await user.click(screen.getByRole('button', { name: 'Guardar zona' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar la zona. Datos inválidos: ring.')
  })

  it('el código previsto sale del nombre; sin nombre pide completarlo', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    expect(screen.getByText(/Obligatorio · Entre 3 y 120 caracteres/)).toBeInTheDocument()

    await user.type(nameField(), 'Hipercentro Financiero')

    expect(screen.getByText('HIPERC-###')).toBeInTheDocument()
    expect(screen.getByText('· se asigna al guardar')).toBeInTheDocument()
  })

  it('un nombre con símbolos no permitidos se marca como inválido', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.type(nameField(), 'Zona #1')

    expect(screen.getByRole('alert')).toHaveTextContent("El nombre solo admite letras, números, espacios y . - & ( ) '.")
    expect(nameField()).toHaveAttribute('aria-invalid', 'true')
  })

  it('un nombre demasiado corto indica el rango permitido', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.type(nameField(), 'Ab')

    expect(screen.getByRole('alert')).toHaveTextContent('El nombre debe tener entre 3 y 120 caracteres.')
  })

  it('lista todo lo que falta para guardar, con el conteo en plural', () => {
    renderPanel()

    expect(screen.getByText('Faltan 5 datos para guardar')).toBeInTheDocument()
    expect(screen.getByText('Nombre de la zona (obligatorio)')).toBeInTheDocument()
    expect(screen.getByText('Perímetro: marca al menos 4 vértices en el mapa')).toBeInTheDocument()
  })

  it('con un solo dato pendiente usa el singular', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()
    await user.type(nameField(), 'Hipercentro Financiero')
    clickMap(SW, SE, NE, NW)
    await user.type(depotNameField(), 'Hub Norte')
    await user.type(longitudeField(), '-78.483')

    expect(screen.getByText('Faltan 1 dato para guardar')).toBeInTheDocument()
    expect(screen.getByText('Indica la latitud de la bodega (entre -5 y 2).')).toBeInTheDocument()
  })

  it('una latitud que no es número no llega al mapa como bodega', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.type(latitudeField(), 'x')

    expect(map().depot).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent('Indica la latitud de la bodega (entre -5 y 2).')
  })

  it('una bodega completa se dibuja en el mapa', async () => {
    const user = userEvent.setup({ delay: null })
    renderPanel()

    await user.type(depotNameField(), 'Hub Norte')
    await user.type(latitudeField(), '-0.179')
    await user.type(longitudeField(), '-78.483')

    expect(map().depot).toEqual({ latitude: -0.179, longitude: -78.483 })
  })
})

describe('pestañas del panel lateral', () => {
  it('la pestaña de zonas registradas muestra el conteo cuando el listado llega', async () => {
    vi.mocked(listZones).mockResolvedValue([zoneFixture(), zoneFixture({ id: 'z-2', code: 'SUR-001', name: 'Sur' })])
    renderPanel()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Zonas registradas/ })).toHaveTextContent(/^Zonas registradas2$/)
    })
  })

  it('mientras carga el listado lo indica en la pestaña de zonas', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(listZones).mockReturnValue(new Promise(() => undefined))
    renderPanel()

    await user.click(screen.getByRole('tab', { name: /Zonas registradas/ }))

    expect(screen.getByText('Cargando zonas…')).toBeInTheDocument()
  })

  it('si el listado no carga, muestra el error en la pestaña de zonas', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(listZones).mockRejectedValue(new ApiError(500, 'INTERNAL', 'boom'))
    renderPanel()

    await user.click(screen.getByRole('tab', { name: /Zonas registradas/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las zonas.')
  })

  it('una zona en edición marca con un punto la pestaña del editor', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(listZones).mockResolvedValue([zoneFixture()])
    renderPanel()
    await startRedrawFromList(user)

    const editorTab = screen.getByRole('tab', { name: 'Editor de zona' })
    expect(editorTab.querySelector('.bg-primary')).not.toBeNull()
  })
})

/** Botón dentro del diálogo, para no confundirlo con los de la página de fondo. */
function dialogButton(dialog: HTMLElement, name: string): HTMLElement {
  const match = [...dialog.querySelectorAll('button')].find((button) => button.getAttribute('aria-label') === name || button.textContent === name)
  if (match === undefined) throw new Error(`No hay botón "${name}" en el diálogo`)
  return match
}
