import { fireEvent, render, screen } from '@testing-library/react-native'
import { stateScript, type MapState } from '../src/features/customer-orders/map/document'
import { LeafletMap } from '../src/features/customer-orders/map/LeafletMap'

const mockInject = jest.fn()

// El WebView nativo no corre en Jest: un doble expone sus props y permite inyectar scripts y mensajes.
jest.mock('react-native-webview', () => {
  const React = require('react')
  const { View } = require('react-native')
  const WebView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }))
    return React.createElement(View, { testID: 'webview', ...props })
  })
  return { WebView }
})

const state: MapState = {
  zones: [{ id: 'z1', name: 'Zona Centro', ring: [{ latitude: -0.1, longitude: -78.6 }], holes: [] }],
  picked: null,
  focus: null,
  highlightId: null,
}

const message = (data: unknown) => ({ nativeEvent: { data: typeof data === 'string' ? data : JSON.stringify(data) } })

beforeEach(() => {
  mockInject.mockClear()
})

describe('LeafletMap (WebView nativo)', () => {
  it('carga el documento de Leaflet y no navega a otra parte', async () => {
    await render(<LeafletMap state={state} onPick={jest.fn()} />)
    const webview = screen.getByTestId('webview')

    expect(webview.props.source.html).toContain('leaflet@1.9.4')
    expect(webview.props.javaScriptEnabled).toBe(true)
    // El documento inicial carga; cualquier enlace (por ejemplo la atribución) no saca al WebView del mapa.
    expect(webview.props.onShouldStartLoadWithRequest({ url: webview.props.source.baseUrl })).toBe(true)
    expect(webview.props.onShouldStartLoadWithRequest({ url: 'https://www.openstreetmap.org/copyright' })).toBe(false)
    expect(webview.props.onShouldStartLoadWithRequest({ url: 'https://evil.example/' })).toBe(false)
  })

  it('no envía el estado hasta que el mapa avisa que está listo, y luego lo inyecta', async () => {
    await render(<LeafletMap state={state} onPick={jest.fn()} />)
    expect(mockInject).not.toHaveBeenCalled()

    await fireEvent(screen.getByTestId('webview'), 'message', message({ type: 'ready' }))

    expect(mockInject).toHaveBeenCalledWith(stateScript(state))
  })

  it('al cambiar el estado vuelve a inyectarlo', async () => {
    const { rerender } = await render(<LeafletMap state={state} onPick={jest.fn()} />)
    await fireEvent(screen.getByTestId('webview'), 'message', message({ type: 'ready' }))
    mockInject.mockClear()
    const next: MapState = { ...state, picked: { latitude: -0.2, longitude: -78.5 }, highlightId: 'z1' }

    await rerender(<LeafletMap state={next} onPick={jest.fn()} />)

    expect(mockInject).toHaveBeenCalledWith(stateScript(next))
  })

  it('traduce un clic del mapa a onPick con coordenadas', async () => {
    const onPick = jest.fn()
    await render(<LeafletMap state={state} onPick={onPick} />)

    await fireEvent(screen.getByTestId('webview'), 'message', message({ type: 'pick', latitude: -0.2, longitude: -78.5 }))

    expect(onPick).toHaveBeenCalledWith({ latitude: -0.2, longitude: -78.5 })
  })

  it('ignora mensajes que no son del mapa o con coordenadas inválidas', async () => {
    const onPick = jest.fn()
    await render(<LeafletMap state={state} onPick={onPick} />)
    const webview = screen.getByTestId('webview')

    await fireEvent(webview, 'message', message('no es json'))
    await fireEvent(webview, 'message', message({ type: 'pick', latitude: 999, longitude: 0 }))
    await fireEvent(webview, 'message', message({ type: 'otra-cosa' }))

    expect(onPick).not.toHaveBeenCalled()
  })
})
