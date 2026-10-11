import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polygon, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { toLatLngTuples } from './latlng'
import type { Coordinate } from './types'

/** Centro por defecto: Quito, donde el equipo ubica sus pruebas. */
const DEFAULT_CENTER: [number, number] = [-0.1807, -78.4678]

export interface MapCanvasProps {
  /** Vértices de la zona en edición: se dibujan como contorno y como marcadores. */
  drawing?: readonly Coordinate[]
  /** Punto seleccionado, marcado en rojo. */
  picked?: Coordinate | null
  /** Polígono a resaltar, por ejemplo la zona que contiene el punto. */
  highlight?: readonly Coordinate[] | null
  /** Punto al que el mapa se centra (por ejemplo, un resultado de búsqueda). */
  focus?: Coordinate | null
  onMapClick: (point: Coordinate) => void
  /** Clic derecho sobre un vértice de `drawing`: recibe sus coordenadas. */
  onVertexRemove?: (point: Coordinate) => void
}

/** Mapa base de OpenStreetMap, sin API key. Respeta la política de uso de sus teselas. */
export function MapCanvas({ drawing = [], picked = null, highlight = null, focus = null, onMapClick, onVertexRemove }: MapCanvasProps) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom className="h-[420px] w-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickListener onMapClick={onMapClick} />
      <FocusController target={focus} />
      {drawing.length > 0 && <Polygon positions={toLatLngTuples(drawing)} pathOptions={{ color: '#0e7075' }} />}
      {highlight !== null && highlight.length > 0 && (
        <Polygon positions={toLatLngTuples(highlight)} pathOptions={{ color: '#1bb3b8', fillOpacity: 0.2 }} />
      )}
      {drawing.map((vertex, i) => (
        <CircleMarker
          key={`v-${String(i)}`}
          center={[vertex.latitude, vertex.longitude]}
          radius={6}
          pathOptions={{ color: '#0e7075', fillOpacity: 1 }}
          eventHandlers={{
            // Un clic sobre un vértice no cuenta como un nuevo punto.
            click: (event) => { event.originalEvent.stopPropagation(); },
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
