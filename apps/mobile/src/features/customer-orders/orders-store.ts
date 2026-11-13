import type { DeliveryEdit } from '../../../../shared/customer-orders/edit'
import { create } from 'zustand'
import { userMessage } from '../../api/errors'
import { cancelOrder, createOrder, editOrder, isServiceUnavailable, listMyOrders } from './api'
import { isActiveTransit, isInProgress, type CustomerOrder, type NewCustomerOrder } from './types'

export const POLL_MS = 10_000
const PENDING_POLL_MS = 30_000
export const UNAVAILABLE_MESSAGE = 'El servicio de pedidos aún no está disponible'

/** Polls active deliveries and checks pending orders for changes from planning or the queue. */
export function pollInterval(orders: readonly CustomerOrder[]): number | false {
  if (orders.some((order) => isActiveTransit(order.status))) return POLL_MS
  return orders.some((order) => isInProgress(order.status)) ? PENDING_POLL_MS : false
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
  edit: (id: string, changes: DeliveryEdit) => Promise<void>
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
  edit: async (id, changes) => {
    try {
      const edited = await editOrder(id, changes)
      set((state) => ({ orders: state.orders.map((order) => order.id === id ? edited : order) }))
    } finally {
      await get().load('poll')
    }
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
