import { isRecord } from '../../../api/parse'
import type { Coordinate } from './geo'

/** Zona a dibujar: contorno, huecos y nombre. */
export interface MapZone {
  id: string
  name: string
  ring: Coordinate[]
  holes: Coordinate[][]
}

/** Todo lo que el mapa necesita saber; el anfitrión lo envía cada vez que cambia. */
export interface MapState {
  zones: MapZone[]
  picked: Coordinate | null
  /** Punto al que centrar el mapa (por ejemplo, el elegido al abrir el mapa ampliado). */
  focus: Coordinate | null
  /** Zona que contiene el punto, resaltada. */
  highlightId: string | null
  /** Paradas de una ruta, en orden: se dibujan numeradas y unidas por una línea. */
  stops?: Coordinate[]
  /** Posición reciente del repartidor, dibujada aparte del punto de entrega. Null o ausente: no se dibuja. */
  driver?: Coordinate | null
  /** Camino por calles de la ruta óptima, dibujado como línea. Vacío o ausente: no se dibuja. */
  road?: Coordinate[]
  /** Pedido de encuadre: al cambiar `key`, el mapa ajusta la vista a `points`. */
  fit?: { points: Coordinate[]; key: string } | null
}

/** Lo que el mapa le avisa al anfitrión. */
export type MapEvent = { type: 'ready' } | { type: 'pick'; latitude: number; longitude: number }

/**
 * Valida un mensaje que llega del mapa (texto JSON del WebView o del iframe). Cualquier cosa que no sea un
 * evento conocido, o un clic con coordenadas inválidas, se ignora: el contenido del mapa no es de confianza.
 */
export function parseMapEvent(raw: unknown): MapEvent | null {
  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!isRecord(data)) return null
  if (data.type === 'ready') return { type: 'ready' }
  if (data.type !== 'pick') return null
  const { latitude, longitude } = data
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { type: 'pick', latitude, longitude }
}

/** Mensaje que se envía al mapa con el estado nuevo. */
export function stateMessage(state: MapState): string {
  return JSON.stringify({ type: 'state', state })
}

/** Script para el WebView nativo: entrega el estado a la función global del documento. */
export function stateScript(state: MapState): string {
  return `window.__setState(${JSON.stringify(state)}); true;`
}

/**
 * Documento HTML del mapa: el mismo Leaflet con teselas de OpenStreetMap que usa la web, con las zonas y el
 * punto elegido dibujados igual. No incrusta datos: el estado llega por mensajes y los nombres se muestran como
 * texto (textContent), nunca como HTML. Leaflet va con versión fija y SRI para que la CDN no pueda cambiarlo.
 */
export function buildMapDocument(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>html,body,#map{height:100%;margin:0;padding:0}.leaflet-container{font-family:system-ui,sans-serif}.stop-n{background:none;border:0;box-shadow:none;color:#fff;font-weight:700;padding:0}.stop-n:before{display:none}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
(function () {
  function send(message) {
    var text = JSON.stringify(message);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(text);
    } else if (window.parent && window.parent !== window) {
      parent.postMessage(text, '*');
    }
  }
  var map = L.map('map').setView([-0.1807, -78.4678], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  var zonesLayer = L.layerGroup().addTo(map);
  var highlightLayer = L.layerGroup().addTo(map);
  var pickedLayer = L.layerGroup().addTo(map);
  var stopsLayer = L.layerGroup().addTo(map);
  var driverLayer = L.layerGroup().addTo(map);
  var driverFitted = false;
  var roadLayer = L.layerGroup().addTo(map);
  var lastFit = null;
  var lastStops = null;
  var lastFocus = null;
  var fitted = false;
  function toLatLng(c) { return [c.latitude, c.longitude]; }
  function polygonRings(zone) {
    return [zone.ring.map(toLatLng)].concat(zone.holes.map(function (hole) { return hole.map(toLatLng); }));
  }
  function drawPicked(point) {
    L.circleMarker(toLatLng(point), { radius: 9, weight: 3, color: '#ffffff', fillColor: '#b42318', fillOpacity: 1 }).addTo(pickedLayer);
  }
  function label(text) {
    var el = document.createElement('span');
    el.textContent = text;
    return el;
  }
  window.__setState = function (state) {
    map.invalidateSize();
    zonesLayer.clearLayers();
    highlightLayer.clearLayers();
    pickedLayer.clearLayers();
    stopsLayer.clearLayers();
    driverLayer.clearLayers();
    roadLayer.clearLayers();
    var all = [];
    (state.zones || []).forEach(function (zone) {
      var rings = polygonRings(zone);
      all = all.concat(rings[0]);
      L.polygon(rings, { color: '#047857', weight: 2, fillColor: '#10b981', fillOpacity: 0.18 })
        .bindTooltip(label(zone.name), { sticky: true, direction: 'top' })
        .addTo(zonesLayer);
      if (state.highlightId === zone.id) {
        L.polygon(rings, { color: '#1bb3b8', fillOpacity: 0.2 }).addTo(highlightLayer);
      }
    });
    if (state.picked) {
      drawPicked(state.picked);
    }
    if (state.driver) {
      L.circleMarker(toLatLng(state.driver), { radius: 10, weight: 3, color: '#ffffff', fillColor: '#0369a1', fillOpacity: 1 })
        .bindTooltip(label('Repartidor'), { direction: 'top' })
        .addTo(driverLayer);
      if (state.picked && !driverFitted) {
        driverFitted = true;
        map.fitBounds([toLatLng(state.driver), toLatLng(state.picked)], { padding: [40, 40], maxZoom: 16 });
      }
    }
    // La ruta óptima por calles va debajo de las paradas.
    if (state.road && state.road.length > 1) {
      L.polyline(state.road.map(toLatLng), { color: '#0369a1', weight: 5, opacity: 0.8 }).addTo(roadLayer);
    }
    // Re-encuadre pedido por el repartidor: solo cuando cambia la key, no en cada render.
    var userFit = false;
    if (state.fit && state.fit.points.length > 0 && state.fit.key !== lastFit) {
      lastFit = state.fit.key;
      userFit = true;
      fitted = true;
      map.fitBounds(state.fit.points.map(toLatLng), { padding: [48, 48], maxZoom: 16 });
    }
    var stops = state.stops || [];
    if (stops.length > 0) {
      var points = stops.map(toLatLng);
      L.polyline(points, { color: '#006b5f', weight: 4, dashArray: '6 6' }).addTo(stopsLayer);
      stops.forEach(function (stop, index) {
        L.circleMarker(toLatLng(stop), { radius: 12, color: '#ffffff', weight: 2, fillColor: index === 0 ? '#006b5f' : '#004b4e', fillOpacity: 1 })
          .bindTooltip(label(String(index + 1)), { permanent: true, direction: 'center', className: 'stop-n' })
          .addTo(stopsLayer);
      });
      // Encuadra paradas y repartidor juntos; vuelve a encuadrar cuando el repartidor aparece por primera vez.
      var stopsKey = JSON.stringify(points) + (state.driver ? '|driver' : '');
      if (stopsKey !== lastStops) {
        lastStops = stopsKey;
        fitted = true;
        // El re-encuadre pedido por el repartidor gana sobre el encuadre automático de paradas.
        if (!userFit) {
          var fitPoints = state.driver ? points.concat([toLatLng(state.driver)]) : points;
          map.fitBounds(fitPoints, { padding: [32, 32], maxZoom: 16 });
        }
      }
    }
    if (!fitted && !state.picked && !state.focus && all.length > 0) {
      fitted = true;
      map.fitBounds(all, { padding: [24, 24], maxZoom: 15 });
    }
    if (state.focus) {
      var key = state.focus.latitude + ',' + state.focus.longitude;
      if (key !== lastFocus) {
        lastFocus = key;
        map.flyTo(toLatLng(state.focus), Math.max(map.getZoom(), 16));
      }
    }
    setTimeout(function () { map.invalidateSize(); }, 50);
  };
  map.on('click', function (event) {
    // El punto se ve al instante; el anfitrión lo confirma después con el estado.
    pickedLayer.clearLayers();
    drawPicked({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    send({ type: 'pick', latitude: event.latlng.lat, longitude: event.latlng.lng });
  });
  function onMessage(event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.type === 'state') { window.__setState(data.state); }
    } catch (error) { /* mensaje ajeno al mapa */ }
  }
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage);
  window.addEventListener('resize', function () { map.invalidateSize(); });
  send({ type: 'ready' });
})();
</script>
</body>
</html>`
}
