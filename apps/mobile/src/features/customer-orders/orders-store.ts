import { create } from 'zustand'
import { userMessage } from '../../api/errors'
import { cancelOrder, createOrder, isServiceUnavailable, listMyOrders } from './api'
import { isActiveTransit, type CustomerOrder, type NewCustomerOrder } from './types'

export const POLL_MS = 10_000
export const UNAVAILABLE_MESSAGE = 'El servicio de pedidos aún no está disponible'

/** Polls every 10 s only while some order is moving; otherwise the list is static. */
export function pollInterval(orders: readonly CustomerOrder[]): number | false {
  return orders.some((order) => isActiveTransit(order.status)) ? POLL_MS : false
}

interface OrdersState {
  orders: CustomerOrder[]
  loading: boolean
  refreshing: boolean
  /** Message to show instead of the list; null when the last load worked. */
  error: string | null
  unavailable: boolean
  load: (mode?: 'initial' | 'refresh' | 'poll') => Promise<void>
  create: (input: NewCustomerOrder) => Promise<CustomerOrder>
  cancel: (id: string) => Promise<void>
  reset: () => void
}

const initial = { orders: [], loading: false, refreshing: false, error: null, unavailable: false }

export const useOrdersStore = create<OrdersState>((set, get) => ({
  ...initial,
  load: async (mode = 'initial') => {
    if (mode === 'initial') set({ loading: true })
    if (mode === 'refresh') set({ refreshing: true })
    try {
      const orders = await listMyOrders()
      set({ orders, error: null, unavailable: false })
    } catch (error) {
      if (isServiceUnavailable(error)) set({ orders: [], error: UNAVAILABLE_MESSAGE, unavailable: true })
      else if (mode !== 'poll') set({ error: userMessage(error), unavailable: false })
    } finally {
      set({ loading: false, refreshing: false })
    }
  },
  create: async (input) => {
    const order = await createOrder(input)
    await get().load('poll')
    return order
  },
  cancel: async (id) => {
    try {
      await cancelOrder(id)
    } finally {
      // A conflict means the status changed meanwhile: refresh in both outcomes.
      await get().load('poll')
    }
  },
  reset: () => {
    set(initial)
  },
}))
