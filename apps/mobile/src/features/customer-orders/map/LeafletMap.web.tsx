import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { buildMapDocument, parseMapEvent, stateMessage } from './document'
import type { LeafletMapProps } from './types'

/**
 * Mapa Leaflet para Expo web: un iframe aislado (sandbox sin same-origin) con el mismo documento y los mismos
 * mensajes que el WebView nativo. Solo se aceptan mensajes que vienen de ese iframe.
 */
export function LeafletMap({ state, onPick, style }: LeafletMapProps) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const [ready, setReady] = useState(false)
  const html = useMemo(buildMapDocument, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source === null || event.source !== frame.current?.contentWindow) return
      const message = parseMapEvent(event.data)
      if (message === null) return
      if (message.type === 'ready') setReady(true)
      else onPick({ latitude: message.latitude, longitude: message.longitude })
    }
    window.addEventListener('message', onMessage)
    return () => { window.removeEventListener('message', onMessage) }
  }, [onPick])

  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage(stateMessage(state), '*')
  }, [ready, state])

  return (
    <View style={[styles.box, style]}>
      {createElement('iframe', {
        ref: frame,
        srcDoc: html,
        sandbox: 'allow-scripts',
        title: 'Mapa de entrega',
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#d9f2f9' },
})
