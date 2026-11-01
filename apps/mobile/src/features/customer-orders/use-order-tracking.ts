import { useEffect, useState } from 'react'
import { useSessionStore } from '../../store/session-store'
import { parseTrackingSnapshot, TRACKING_SUBPROTOCOL, trackingSocketUrl, type TrackingSnapshot } from './tracking'

export interface OrderTrackingState {
  /** Latest snapshot pushed by the Gateway, or null until the first message arrives. */
  snapshot: TrackingSnapshot | null
  /** True when the socket fails, the session has no token, or a message cannot be parsed. */
  unavailable: boolean
}

/**
 * Live tracking of one order over the Gateway WebSocket. The Gateway sends the current snapshot
 * first and then a new one whenever the view changes. Closing the socket on unmount or on an
 * order change is intentional and is not reported as unavailable.
 */
export function useOrderTracking(orderId: string): OrderTrackingState {
  const [state, setState] = useState<OrderTrackingState>({ snapshot: null, unavailable: false })

  useEffect(() => {
    const token = useSessionStore.getState().token
    if (!token) {
      setState({ snapshot: null, unavailable: true })
      return
    }

    let closedByUs = false
    setState({ snapshot: null, unavailable: false })
    const socket = new WebSocket(trackingSocketUrl(orderId), [TRACKING_SUBPROTOCOL, token])

    socket.onmessage = (event) => {
      try {
        const snapshot = parseTrackingSnapshot(JSON.parse(String(event.data)))
        setState({ snapshot, unavailable: false })
      } catch {
        setState((prev) => ({ ...prev, unavailable: true }))
      }
    }
    socket.onerror = () => {
      if (!closedByUs) setState((prev) => ({ ...prev, unavailable: true }))
    }
    socket.onclose = () => {
      if (!closedByUs) setState((prev) => ({ ...prev, unavailable: true }))
    }

    return () => {
      closedByUs = true
      socket.close()
    }
  }, [orderId])

  return state
}
