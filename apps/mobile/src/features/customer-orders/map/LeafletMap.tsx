import { useEffect, useMemo, useRef, useState, type ForwardRefExoticComponent, type RefAttributes } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView as WebViewComponent, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview'
import { buildMapDocument, parseMapEvent, stateScript } from './document'
import { mapTileSource } from './tiles'
import type { LeafletMapProps } from './types'

/** Metodos del WebView nativo que usa el mapa. react-native-webview 14 no los expone en su tipo generico. */
interface MapWebView {
  injectJavaScript: (script: string) => void
}

/** El WebView nativo acepta ref; su tipo generico de la 14 no lo declara, asi que se tipa aqui una sola vez. */
const WebView = WebViewComponent as unknown as ForwardRefExoticComponent<WebViewProps & RefAttributes<MapWebView>>

/** URL base del documento: con ella las teselas de OpenStreetMap reciben un origen válido. */
const BASE_URL = 'https://localhost/'

/**
 * Mapa Leaflet en un WebView (iOS y Android): el mismo mapa que la web. La web de Expo usa LeafletMap.web.tsx,
 * con un iframe y el mismo documento y los mismos mensajes.
 */
export function LeafletMap({ state, onPick, style }: LeafletMapProps) {
  const webView = useRef<MapWebView>(null)
  const [ready, setReady] = useState(false)
  const html = useMemo(() => buildMapDocument(undefined, mapTileSource(process.env.EXPO_PUBLIC_MAP_TILE_KEY)), [])

  useEffect(() => {
    if (ready) webView.current?.injectJavaScript(stateScript(state))
  }, [ready, state])

  const onMessage = (event: WebViewMessageEvent) => {
    const message = parseMapEvent(event.nativeEvent.data)
    if (message === null) return
    if (message.type === 'ready') setReady(true)
    else onPick({ latitude: message.latitude, longitude: message.longitude })
  }

  return (
    <View style={[styles.box, style]}>
      <WebView
        ref={webView}
        source={{ html, baseUrl: BASE_URL }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        setSupportMultipleWindows={false}
        // Solo carga el documento inicial: un enlace (por ejemplo la atribución) no saca al WebView del mapa.
        onShouldStartLoadWithRequest={(request) => request.url === BASE_URL || request.url === 'about:blank'}
        onMessage={onMessage}
        accessibilityLabel="Mapa de entrega"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#d9f2f9' },
})
