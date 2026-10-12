import { useEffect } from 'react'
import { pollInterval, useOrdersStore } from './orders-store'

/** Loads on mount and polls while some order is in active transit. */
export function useMyOrders() {
  const state = useOrdersStore()
  const { load } = state
  const interval = pollInterval(state.orders)

  useEffect(() => {
    void load('initial')
  }, [load])

  useEffect(() => {
    if (interval === false) return undefined
    const timer = setInterval(() => {
      void load('poll')
    }, interval)
    return () => {
      clearInterval(timer)
    }
  }, [interval, load])

  return state
}
