import { act, render } from '@testing-library/react-native'
import { LeafletMap } from '../LeafletMap.web'
import type { MapState } from '../document'

const state: MapState = { zones: [], picked: null, focus: null, highlightId: null }

// The Node-based Jest environment has no DOM window: provide just the listener API the component uses.
const fakeWindow = { addEventListener: jest.fn(), removeEventListener: jest.fn() }
const globalScope = globalThis as unknown as { window?: unknown }
const previousWindow = globalScope.window

type MessageListener = (event: MessageEvent) => void

function messageEvent(data: string, overrides: Partial<{ origin: string; source: unknown }> = {}): MessageEvent {
  return { origin: 'null', source: undefined, data, ...overrides } as unknown as MessageEvent
}

describe('LeafletMap (web iframe)', () => {
  let onPick: jest.Mock
  let listener: MessageListener

  beforeAll(async () => {
    globalScope.window = fakeWindow
    onPick = jest.fn()
    await render(<LeafletMap state={state} onPick={onPick} />)
    // Flush the mount effects (the message listener) before the tests read it.
    await act(async () => {
      await Promise.resolve()
    })
    const call = fakeWindow.addEventListener.mock.calls.find(([type]) => type === 'message')
    if (!call) throw new Error('LeafletMap did not register a message listener')
    listener = call[1] as MessageListener
  })

  afterEach(() => {
    onPick.mockClear()
  })

  afterAll(() => {
    globalScope.window = previousWindow
  })

  it('ignores messages whose origin is not the sandboxed frame opaque origin', () => {
    const pick = JSON.stringify({ type: 'pick', latitude: -2.1, longitude: -79.9 })
    act(() => listener(messageEvent(pick, { origin: 'https://evil.example' })))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('ignores messages without a source window', () => {
    const pick = JSON.stringify({ type: 'pick', latitude: -2.1, longitude: -79.9 })
    act(() => listener(messageEvent(pick, { source: null })))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('ignores payloads that are not known map events', () => {
    act(() => listener(messageEvent('not json')))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('reports a valid pick from the frame', () => {
    const pick = JSON.stringify({ type: 'pick', latitude: -2.1, longitude: -79.9 })
    // No DOM frame exists in this environment, so the frame window is undefined and matches an undefined source.
    act(() => listener(messageEvent(pick)))
    expect(onPick).toHaveBeenCalledWith({ latitude: -2.1, longitude: -79.9 })
  })

  it('accepts a ready announcement without reporting a pick', () => {
    act(() => listener(messageEvent(JSON.stringify({ type: 'ready' }))))
    expect(onPick).not.toHaveBeenCalled()
  })
})
