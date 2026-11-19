import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { agoLabel } from '@/features/tracking/ago'

export interface MapStop {
  orderId: string
  sequence: number
  latitude: number
  longitude: number
  /** Parada ya cerrada (entregada o no entregada): se dibuja apagada. */
  done?: boolean
}

/** Repartidor en el mapa, en su última posición conocida. */
export interface MapDriver {
  routeId: string
  name: string
  latitude: number
  longitude: number
  /** Momento de la posición, RFC 3339: el mapa dice qué tan vieja es ("hace 12 s"). */
  recordedAt: string
}

export interface MapRoute {
  id: string
  driverName: string
  color: string
  stops: MapStop[]
}

/** Centro por defecto: Quito, donde el equipo ubica sus pruebas. */
const DEFAULT_CENTER: [number, number] = [-0.1807, -78.4678]

/** Una línea por ruta que crece parada a parada, con cada parada numerada. */
export function RouteMap({
  routes,
  latestOrderId,
  drivers = [],
  now,
  onSelectRoute,
}: {
  routes: readonly MapRoute[]
  latestOrderId: string | null
  drivers?: readonly MapDriver[]
  /** Hora con la que se calcula "hace X": la pantalla la renueva para que no se quede vieja entre consultas. */
  now?: number
  /** Clic en una parada o en un repartidor: recibe la ruta a la que pertenece. */
  onSelectRoute?: (routeId: string) => void
}) {
  // El encuadre sigue a las paradas, no a los repartidores: si se moviera con cada posición, quitaría el zoom del operador.
  const points = useMemo(
    () => routes.flatMap((route) => route.stops.map((s): [number, number] => [s.latitude, s.longitude])),
    [routes],
  )
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom className="h-[360px] w-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Fit points={points} />
      {routes.map((route) => (
        <Polyline
          key={`l-${route.id}`}
          positions={route.stops.map((s): [number, number] => [s.latitude, s.longitude])}
          pathOptions={{ color: route.color, weight: 4, opacity: 0.85 }}
        />
      ))}
      {routes.flatMap((route) =>
        route.stops.map((stop) => (
          <CircleMarker
            key={`m-${stop.orderId}`}
            center={[stop.latitude, stop.longitude]}
            radius={stop.orderId === latestOrderId ? 13 : 10}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: stop.done === true ? '#94a3b8' : route.color, fillOpacity: stop.done === true ? 0.7 : 1 }}
            eventHandlers={{ click: () => { onSelectRoute?.(route.id); } }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {`${String(stop.sequence)} · ${route.driverName}`}
            </Tooltip>
          </CircleMarker>
        )),
      )}
      {drivers.map((driver) => (
        <CircleMarker
          key={`d-${driver.routeId}`}
          center={[driver.latitude, driver.longitude]}
          radius={12}
          pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#dc2626', fillOpacity: 1 }}
          eventHandlers={{ click: () => { onSelectRoute?.(driver.routeId); } }}
        >
          <Tooltip permanent direction="bottom" offset={[0, 10]}>
            {`${driver.name} · ${agoLabel(driver.recordedAt, now)}`}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

/** Encuadra el mapa para que todas las paradas visibles queden a la vista. */
function Fit({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) map.fitBounds(points, { padding: [60, 60], maxZoom: 16 })
  }, [map, points])
  return null
}
