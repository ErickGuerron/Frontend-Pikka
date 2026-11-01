import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MapCanvas, type MapZone } from './MapCanvas'
import type { Coordinate } from './types'

// Leaflet necesita un navegador con dimensiones reales: aquí los componentes de react-leaflet exponen
// sus props y los botones disparan los mismos handlers que dispararía el mapa.
const leaflet = vi.hoisted(() => ({
  handlers: null as null | Record<string, (event: unknown) => void>,
  map: { flyTo: vi.fn(), fitBounds: vi.fn(), getZoom: vi.fn(() => 12) },
}))

vi.mock('react-leaflet', async () => {
  const React = await import('react')
  const mapped = (tag: string, props: Record<string, unknown>, children?: React.ReactNode) =>
    React.createElement(tag, props, children)
  return {
    MapContainer: ({ children, className }: { children?: React.ReactNode; className?: string }) =>
      mapped('div', { 'data-testid': 'map', 'data-class': className }, children),
    TileLayer: () => null,
    Polygon: ({ positions, children }: { positions: unknown; children?: React.ReactNode }) =>
      mapped('div', { 'data-testid': 'polygon', 'data-positions': JSON.stringify(positions) }, children),
    Polyline: ({ positions, children }: { positions: unknown; children?: React.ReactNode }) =>
      mapped('div', { 'data-testid': 'polyline', 'data-positions': JSON.stringify(positions) }, children),
    CircleMarker: ({
      center,
      eventHandlers,
      children,
    }: {
      center: [number, number]
      eventHandlers?: Record<string, (event: unknown) => void>
      children?: React.ReactNode
    }) => {
      const key = `${String(center[0])},${String(center[1])}`
      return mapped(
        'div',
        { 'data-testid': 'marker', 'data-center': JSON.stringify(center) },
        React.createElement(
          React.Fragment,
          null,
          React.createElement('button', {
            type: 'button',
            onClick: () => { eventHandlers?.click?.({ originalEvent: { stopPropagation: vi.fn() } }) },
          }, `clic ${key}`),
          React.createElement('button', {
            type: 'button',
            onContextMenu: () => {
              eventHandlers?.contextmenu?.({ originalEvent: { preventDefault: vi.fn(), stopPropagation: vi.fn() } })
            },
          }, `derecho ${key}`),
          children,
        ),
      )
    },
    Tooltip: ({ children }: { children?: React.ReactNode }) => mapped('span', { 'data-testid': 'tooltip' }, children),
    useMap: () => leaflet.map,
    useMapEvents: (handlers: Record<string, (event: unknown) => void>) => {
      leaflet.handlers = handlers
      return null
    },
  }
})

const at = (latitude: number, longitude: number): Coordinate => ({ latitude, longitude })
const tuple = (point: Coordinate) => [point.latitude, point.longitude]
const vertexKey = (point: Coordinate | undefined) => `${String(point?.latitude)},${String(point?.longitude)}`

const ring = [at(-0.1, -78.6), at(-0.1, -78.4), at(-0.3, -78.4)]
const hole = [at(-0.15, -78.55), at(-0.15, -78.45), at(-0.25, -78.45)]

const zone: MapZone = { id: 'z-1', name: 'Zona Norte', ring, holes: [hole] }

beforeEach(() => {
  leaflet.handlers = null
  leaflet.map.flyTo.mockClear()
  leaflet.map.fitBounds.mockClear()
  leaflet.map.getZoom.mockReturnValue(12)
})

describe('mapa: capas de zonas y referencias', () => {
  it('dibuja cada zona con su nombre y sus huecos como anillos interiores', () => {
    render(<MapCanvas zones={[zone]} onMapClick={vi.fn()} />)

    const polygon = screen.getByTestId('polygon')
    expect(JSON.parse(polygon.dataset.positions ?? '[]')).toEqual([ring.map(tuple), hole.map(tuple)])
    expect(screen.getByTestId('tooltip')).toHaveTextContent('Zona Norte')
  })

  it('dibuja el contorno de referencia solo cuando hay puntos', () => {
    const { rerender } = render(<MapCanvas reference={ring} onMapClick={vi.fn()} />)
    expect(screen.getAllByTestId('polygon')).toHaveLength(1)
    expect(JSON.parse(screen.getByTestId('polygon').dataset.positions ?? '[]')).toEqual(ring.map(tuple))

    rerender(<MapCanvas reference={[]} onMapClick={vi.fn()} />)
    expect(screen.queryAllByTestId('polygon')).toHaveLength(0)
  })

  it('dibuja los huecos guardados de la zona en un polígono sin relleno', () => {
    render(<MapCanvas holes={[hole]} onMapClick={vi.fn()} />)
    expect(JSON.parse(screen.getByTestId('polygon').dataset.positions ?? '[]')).toEqual(hole.map(tuple))
  })

  it('resalta el polígono con sus huecos como anillos interiores', () => {
    render(<MapCanvas highlight={ring} highlightHoles={[hole]} onMapClick={vi.fn()} />)
    expect(JSON.parse(screen.getByTestId('polygon').dataset.positions ?? '[]')).toEqual([ring.map(tuple), hole.map(tuple)])
  })

  it('no resalta nada con un polígono vacío', () => {
    render(<MapCanvas highlight={[]} onMapClick={vi.fn()} />)
    expect(screen.queryAllByTestId('polygon')).toHaveLength(0)
  })
})

describe('mapa: edición de vértices', () => {
  it('con contorno de referencia, el contorno en edición no incluye los huecos guardados', () => {
    render(<MapCanvas drawing={ring} reference={zone.ring} holes={[hole]} onMapClick={vi.fn()} />)

    const polygons = screen.getAllByTestId('polygon').map((p) => JSON.parse(p.dataset.positions ?? '[]') as unknown)
    expect(polygons).toContainEqual(ring.map(tuple))
  })

  it('sin referencia, el contorno en edición incluye los huecos guardados como anillos interiores', () => {
    render(<MapCanvas drawing={ring} holes={[hole]} onMapClick={vi.fn()} />)

    const polygons = screen.getAllByTestId('polygon').map((p) => JSON.parse(p.dataset.positions ?? '[]') as unknown)
    expect(polygons).toContainEqual([ring.map(tuple), hole.map(tuple)])
  })

  it('cada vértice es un marcador: clic izquierdo llama onVertexClick y clic derecho onVertexRemove', () => {
    const onVertexClick = vi.fn()
    const onVertexRemove = vi.fn()
    render(<MapCanvas drawing={ring} onMapClick={vi.fn()} onVertexClick={onVertexClick} onVertexRemove={onVertexRemove} />)

    expect(screen.getAllByTestId('marker')).toHaveLength(ring.length)
    fireEvent.click(screen.getByRole('button', { name: `clic ${vertexKey(ring[1])}` }))
    expect(onVertexClick).toHaveBeenCalledWith(ring[1])

    fireEvent.contextMenu(screen.getByRole('button', { name: `derecho ${vertexKey(ring[2])}` }))
    expect(onVertexRemove).toHaveBeenCalledWith(ring[2])
  })

  it('un clic sobre un vértice sin onVertexClick no falla', () => {
    render(<MapCanvas drawing={ring} onMapClick={vi.fn()} />)
    expect(() => { fireEvent.click(screen.getByRole('button', { name: `clic ${vertexKey(ring[0])}` })) }).not.toThrow()
  })
})

describe('mapa: selección, bodega y eventos', () => {
  it('marca el punto elegido y reenvía los clics del mapa con latitud y longitud', () => {
    const onMapClick = vi.fn()
    render(<MapCanvas picked={at(-0.2, -78.5)} onMapClick={onMapClick} />)

    expect(screen.getByTestId('marker')).toHaveAttribute('data-center', JSON.stringify([-0.2, -78.5]))
    leaflet.handlers?.click?.({ latlng: { lat: -0.21, lng: -78.51 } })
    expect(onMapClick).toHaveBeenCalledWith({ latitude: -0.21, longitude: -78.51 })
  })

  it('dibuja la línea de la bodega al punto elegido con la distancia y muestra el nombre de la bodega', () => {
    render(
      <MapCanvas
        picked={at(-0.2, -78.5)}
        depot={at(-0.18, -78.48)}
        depotName="Hub Central"
        depotDistanceLabel="1,2 km"
        onMapClick={vi.fn()}
      />,
    )

    const line = screen.getByTestId('polyline')
    expect(JSON.parse(line.dataset.positions ?? '[]')).toEqual([[-0.18, -78.48], [-0.2, -78.5]])
    expect(within(line).getByTestId('tooltip')).toHaveTextContent('1,2 km')
    expect(screen.getByText('Hub Central')).toBeInTheDocument()
  })

  it('sin punto elegido no traza la línea de la bodega, pero sí su marcador', () => {
    render(<MapCanvas depot={at(-0.18, -78.48)} onMapClick={vi.fn()} />)
    expect(screen.queryByTestId('polyline')).toBeNull()
    expect(screen.getByTestId('marker')).toBeInTheDocument()
  })

  it('la línea de la bodega no muestra etiqueta si no hay distancia ni nombre', () => {
    render(<MapCanvas picked={at(-0.2, -78.5)} depot={at(-0.18, -78.48)} onMapClick={vi.fn()} />)
    expect(screen.getByTestId('polyline')).toBeInTheDocument()
    expect(screen.queryAllByTestId('tooltip')).toHaveLength(0)
  })
})

describe('mapa: encuadre', () => {
  it('centra el mapa en el punto recibido con zoom de al menos 16', () => {
    const { rerender } = render(<MapCanvas focus={at(-0.2, -78.5)} onMapClick={vi.fn()} />)
    expect(leaflet.map.flyTo).toHaveBeenCalledWith([-0.2, -78.5], 16)

    rerender(<MapCanvas focus={null} onMapClick={vi.fn()} />)
    expect(leaflet.map.flyTo).toHaveBeenCalledTimes(1)
  })

  it('conserva un zoom mayor que 16 al centrar', () => {
    leaflet.map.getZoom.mockReturnValue(18)
    render(<MapCanvas focus={at(-0.2, -78.5)} onMapClick={vi.fn()} />)
    expect(leaflet.map.flyTo).toHaveBeenCalledWith([-0.2, -78.5], 18)
  })

  it('encuadra los puntos recibidos y no encuadra una lista vacía', () => {
    const { rerender } = render(<MapCanvas fitBounds={ring} onMapClick={vi.fn()} />)
    expect(leaflet.map.fitBounds).toHaveBeenCalledWith(ring.map(tuple), { padding: [40, 40], maxZoom: 17 })

    rerender(<MapCanvas fitBounds={[]} onMapClick={vi.fn()} />)
    expect(leaflet.map.fitBounds).toHaveBeenCalledTimes(1)
  })
})
