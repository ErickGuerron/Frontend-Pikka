import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelOrder, createOrder, listMyOrders } from './api'
import { isActiveTransit, type CustomerOrder } from './types'

export const myOrdersKey = ['customer-orders'] as const

const POLL_MS = 10_000

/** Polls every 10 s only while some order is moving; otherwise the list is static. */
export function pollInterval(orders: readonly CustomerOrder[] | undefined): number | false {
  return orders?.some((order) => isActiveTransit(order.status)) === true ? POLL_MS : false
}

export function useMyOrders() {
  return useQuery({
    queryKey: myOrdersKey,
    queryFn: ({ signal }) => listMyOrders(signal),
    refetchInterval: (query) => pollInterval(query.state.data),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myOrdersKey }),
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelOrder,
    // A conflict means the status changed meanwhile; refresh in both outcomes.
    onSettled: () => queryClient.invalidateQueries({ queryKey: myOrdersKey }),
  })
}
