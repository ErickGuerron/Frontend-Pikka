import { buildMapDocument, parseMapEvent } from '../src/features/customer-orders/map/document'

describe('parseMapEvent', () => {
  it('acepta un clic válido enviado como texto JSON', () => {
    expect(parseMapEvent(JSON.stringify({ type: 'pick', latitude: -0.2, longitude: -78.5 }))).toEqual({
      type: 'pick',
      latitude: -0.2,
      longitude: -78.5,
    })
  })

  it('acepta el aviso de mapa listo, como texto o como objeto', () => {
    expect(parseMapEvent('{"type":"ready"}')).toEqual({ type: 'ready' })
    expect(parseMapEvent({ type: 'ready' })).toEqual({ type: 'ready' })
  })

  it('ignora lo que no es un evento del mapa', () => {
    for (const raw of [undefined, null, 42, '', 'no es json', '[]', '{}', '{"type":"otra"}', { type: 'pick' }]) {
      expect(parseMapEvent(raw)).toBeNull()
    }
  })

  it('descarta coordenadas fuera de rango o que no son números', () => {
    for (const [latitude, longitude] of [[91, 0], [-91, 0], [0, 181], [0, -181], ['1', 2], [Number.NaN, 0], [null, 0]]) {
      expect(parseMapEvent({ type: 'pick', latitude, longitude })).toBeNull()
    }
    expect(parseMapEvent({ type: 'pick', latitude: 90, longitude: -180 })).not.toBeNull()
  })
})

describe('buildMapDocument', () => {
  const html = buildMapDocument()

  it('es el mismo mapa de la web: Leaflet con teselas de OpenStreetMap, con versión fija y SRI', () => {
    expect(html).toContain('leaflet@1.9.4/dist/leaflet.js')
    expect(html).toContain('leaflet@1.9.4/dist/leaflet.css')
    expect(html).toMatch(/integrity="sha256-[A-Za-z0-9+/=]+"/)
    expect(html).toContain('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(html).toContain('OpenStreetMap')
  })

  it('dibuja las zonas con los mismos colores que la web y la zona resaltada', () => {
    expect(html).toContain('#047857')
    expect(html).toContain('#10b981')
    expect(html).toContain('#1bb3b8')
  })

  it('no incrusta datos: el estado llega por mensajes, así un nombre de zona no puede inyectar HTML', () => {
    expect(html).not.toMatch(/Zona Centro/)
    // Los nombres se muestran como texto, nunca como HTML.
    expect(html).toContain('textContent')
    expect(html).not.toContain('innerHTML')
  })

  it('avisa al anfitrión por WebView nativo o, en web, por postMessage del iframe', () => {
    expect(html).toContain('ReactNativeWebView.postMessage')
    expect(html).toContain('parent.postMessage')
  })

  it('recibe el estado por una función global y por mensajes', () => {
    expect(html).toContain('window.__setState')
    expect(html).toContain("addEventListener('message'")
  })

  it('dibuja la ruta óptima por calles debajo de las paradas', () => {
    expect(html).toContain('state.road')
    expect(html).toContain('roadLayer')
  })

  it('re-encuadra solo cuando el repartidor pide un encuadre nuevo (key distinta), no en cada render', () => {
    expect(html).toContain('state.fit.key !== lastFit')
    expect(html).toContain('state.fit.points')
  })

  it('encuadra la ruta incluyendo al repartidor junto a las paradas', () => {
    expect(html).toContain('var fitPoints = state.driver ? points.concat([toLatLng(state.driver)]) : points')
    expect(html).toContain('map.fitBounds(fitPoints')
  })
})
