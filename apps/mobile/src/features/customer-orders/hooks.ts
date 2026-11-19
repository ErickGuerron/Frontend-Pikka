import { useCallback, useEffect, useState } from 'react'
import { userMessage } from '../../api/errors'
import { listProducts } from './api'
import { pollInterval, useOrdersStore } from './orders-store'
import type { Product } from './products'

export interface CatalogState {
  products: Product[]
  loading: boolean
  error: string | null
  reload: () => void
}

/** Active products the customer can order; loads on mount and on `reload`. */
export function useCatalog(): CatalogState {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    listProducts(controller.signal)
      .then((list) => {
        setProducts(list)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(userMessage(cause))
        setLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [attempt])

  const reload = useCallback(() => {
    setAttempt((n) => n + 1)
  }, [])
  return { products, loading, error, reload }
}

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
