import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { buildMapDocument, parseMapEvent, stateScript } from './document'
import type { LeafletMapProps } from './types'

/** URL base del documento: con ella las teselas de OpenStreetMap reciben un origen válido. */
const BASE_URL = 'https://localhost/'

/**
 * Mapa Leaflet en un WebView (iOS y Android): el mismo mapa que la web. La web de Expo usa LeafletMap.web.tsx,
 * con un iframe y el mismo documento y los mismos mensajes.
 */
export function LeafletMap({ state, onPick, style }: LeafletMapProps) {
  const webView = useRef<WebView>(null)
  const [ready, setReady] = useState(false)
  const html = useMemo(buildMapDocument, [])

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
