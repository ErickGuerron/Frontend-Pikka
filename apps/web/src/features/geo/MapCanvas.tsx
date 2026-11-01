import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { toLatLngTuples } from './latlng'
import type { Coordinate } from './types'

/** Zona de cobertura a dibujar: contorno, huecos y nombre. */
export interface MapZone {
  id: string
  name: string
  ring: readonly Coordinate[]
  holes: readonly (readonly Coordinate[])[]
}

/** Centro por defecto: Quito, donde el equipo ubica sus pruebas. */
const DEFAULT_CENTER: [number, number] = [-0.1807, -78.4678]

export interface MapCanvasProps {
  /** Vértices de la zona en edición: se dibujan como contorno y como marcadores. */
  drawing?: readonly Coordinate[]
  /** Zonas de cobertura: se dibujan en verde con su nombre, debajo del resto de capas. */
  zones?: readonly MapZone[]
  /** Punto seleccionado, marcado en rojo. */
  picked?: Coordinate | null
  /** Polígono a resaltar, por ejemplo la zona que contiene el punto. */
  highlight?: readonly Coordinate[] | null
  /** Huecos del polígono resaltado. */
  highlightHoles?: readonly (readonly Coordinate[])[]
  /** Punto al que el mapa se centra (por ejemplo, un resultado de búsqueda). */
  focus?: Coordinate | null
  /**
   * Puntos que el mapa debe mostrar completos, por ejemplo el anillo de una zona. Cada arreglo nuevo
   * (aunque tenga los mismos puntos) vuelve a encuadrar el mapa.
   */
  fitBounds?: readonly Coordinate[] | null
  onMapClick: (point: Coordinate) => void
  /** Clic derecho sobre un vértice de `drawing`: recibe sus coordenadas. */
  onVertexRemove?: (point: Coordinate) => void
  /** Clic izquierdo sobre un vértice de `drawing` (por ejemplo, herramienta de borrar vértice). */
  onVertexClick?: ((point: Coordinate) => void) | undefined
  /** Huecos ya guardados de la zona (dona), en ámbar. */
  holes?: readonly (readonly Coordinate[])[]
  /** Contorno de referencia que no se edita, por ejemplo el exterior mientras se dibuja un hueco. */
  reference?: readonly Coordinate[] | null
  /** Bodega de salida, dibujada como marcador ámbar. */
  depot?: Coordinate | null
  /** Nombre de la bodega, junto a su marcador. */
  depotName?: string | null
  /** Distancia en línea recta de la bodega al punto elegido, sobre la línea que los une. */
  depotDistanceLabel?: string | null
  /** Clases de tamaño del contenedor. Por defecto, 420 px de alto a ancho completo. */
  className?: string
}

/** Mapa base de OpenStreetMap, sin API key. Respeta la política de uso de sus teselas. */
export function MapCanvas({
  drawing = [],
  zones = [],
  picked = null,
  highlight = null,
  highlightHoles = [],
  focus = null,
  fitBounds = null,
  onMapClick,
  onVertexRemove,
  onVertexClick,
  holes = [],
  reference = null,
  depot = null,
  depotName = null,
  depotDistanceLabel = null,
  className = 'h-[420px] w-full rounded-xl z-0',
}: MapCanvasProps) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickListener onMapClick={onMapClick} />
      <FocusController target={focus} />
      <FitController bounds={fitBounds} />
      {zones.map((zone) => (
        // El hueco va como anillo interior: queda transparente y se ve que ahí no hay cobertura.
        <Polygon
          key={`z-${zone.id}`}
          positions={[toLatLngTuples(zone.ring), ...zone.holes.map((hole) => toLatLngTuples(hole))]}
          pathOptions={{ color: '#047857', weight: 2, fillColor: '#10b981', fillOpacity: 0.18 }}
        >
          <Tooltip sticky direction="top">{zone.name}</Tooltip>
        </Polygon>
      ))}
      {reference !== null && reference.length > 0 && (
        <Polygon positions={toLatLngTuples(reference)} pathOptions={{ color: '#0e7075', weight: 1, dashArray: '4 4', fill: false }} />
      )}
      {holes.map((hole, i) => (
        <Polygon key={`h-${String(i)}`} positions={toLatLngTuples(hole)} pathOptions={{ color: '#b45309', fill: false }} />
      ))}
      {drawing.length > 0 && (
        // Al editar el contorno, los huecos guardados son anillos interiores: quedan transparentes, igual que en la clasificación.
        <Polygon
          positions={reference === null ? [toLatLngTuples(drawing), ...holes.map((hole) => toLatLngTuples(hole))] : toLatLngTuples(drawing)}
          pathOptions={{ color: '#0e7075' }}
        />
      )}
      {highlight !== null && highlight.length > 0 && (
        // Un solo polígono con sus huecos como anillos interiores: el hueco queda transparente y se ve el mapa.
        <Polygon
          positions={[toLatLngTuples(highlight), ...highlightHoles.map((hole) => toLatLngTuples(hole))]}
          pathOptions={{ color: '#1bb3b8', fillOpacity: 0.2 }}
        />
      )}
      {drawing.map((vertex, i) => (
        <CircleMarker
          key={`v-${String(i)}`}
          center={[vertex.latitude, vertex.longitude]}
          radius={6}
          pathOptions={{ color: '#0e7075', fillOpacity: 1 }}
          eventHandlers={{
            // Un clic sobre un vértice no cuenta como un nuevo punto.
            click: (event) => {
              event.originalEvent.stopPropagation()
              onVertexClick?.(vertex)
            },
            contextmenu: (event) => {
              event.originalEvent.preventDefault()
              event.originalEvent.stopPropagation()
              onVertexRemove?.(vertex)
            },
          }}
        />
      ))}
      {picked !== null && (
        <CircleMarker center={[picked.latitude, picked.longitude]} radius={7} pathOptions={{ color: '#b42318' }} />
      )}
      {depot !== null && picked !== null && (
        <Polyline positions={[[depot.latitude, depot.longitude], [picked.latitude, picked.longitude]]} pathOptions={{ color: '#0d5d68', dashArray: '6 6', weight: 2.5 }}>
          {depotDistanceLabel ? <Tooltip permanent direction="center" className="font-semibold">{depotDistanceLabel}</Tooltip> : null}
        </Polyline>
      )}
      {depot !== null && (
        <CircleMarker
          center={[depot.latitude, depot.longitude]}
          radius={9}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#b45309', fillOpacity: 1 }}
        >
          {depotName ? <Tooltip permanent direction="right" offset={[10, 0]}>{depotName}</Tooltip> : null}
        </CircleMarker>
      )}
    </MapContainer>
  )
}

function ClickListener({ onMapClick }: { onMapClick: (point: Coordinate) => void }) {
  useMapEvents({
    click: (event) => {
      onMapClick({ latitude: event.latlng.lat, longitude: event.latlng.lng })
    },
  })
  return null
}

/** Centra el mapa en el punto recibido. Solo mueve la vista; no toca el estado del mapa. */
function FocusController({ target }: { target: Coordinate | null }) {
  const map = useMap()
  useEffect(() => {
    if (target !== null) map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 16))
  }, [map, target])
  return null
}

/** Encuadra el mapa para que todos los puntos recibidos queden visibles. */
function FitController({ bounds }: { bounds: readonly Coordinate[] | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds === null || bounds.length === 0) return
    map.fitBounds(toLatLngTuples(bounds), { padding: [40, 40], maxZoom: 17 })
  }, [map, bounds])
  return null
}
