import type { DeliveryEdit } from '../../../../shared/customer-orders/edit'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelOrder, createOrder, editOrder, getMyBalance, getOrderTracking, isDemoMode, listMyNotifications, listMyOrders, openDispute, payMyBalance } from './api'
import { isActiveTransit, isInProgress, isOnTheWay, type CustomerOrder } from './types'

export const myOrdersKey = ['customer-orders'] as const

const POLL_MS = 10_000
const PENDING_POLL_MS = 30_000

/** Polls active deliveries and checks pending orders for changes from planning or the queue. */
export function pollInterval(orders: readonly CustomerOrder[] | undefined): number | false {
  if (orders?.some((order) => isActiveTransit(order.status))) return POLL_MS
  return orders?.some((order) => isInProgress(order.status)) ? PENDING_POLL_MS : false
}

export function useMyOrders() {
  return useQuery({
    queryKey: myOrdersKey,
    queryFn: ({ signal }) => listMyOrders(signal),
    refetchInterval: (query) => pollInterval(query.state.data),
  })
}

export const myNotificationsKey = ['customer-notifications'] as const

export function useMyNotifications() {
  return useQuery({
    queryKey: myNotificationsKey,
    queryFn: ({ signal }) => listMyNotifications(signal),
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

export const myBalanceKey = ['customer-balance'] as const

/** El saldo del cliente. Sin reintentos: si el servicio no responde, la tarjeta simplemente no aparece. */
export function useMyBalance() {
  return useQuery({
    queryKey: myBalanceKey,
    queryFn: ({ signal }) => getMyBalance(signal),
    enabled: !isDemoMode(),
    retry: false,
  })
}

export function usePayBalance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => payMyBalance(),
    // Aprobado, rechazado o con error, el saldo y la cuenta pueden haber cambiado: se refrescan siempre.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: myBalanceKey }),
        queryClient.invalidateQueries({ queryKey: myOrdersKey }),
      ]),
  })
}

/** Disputa un recargo. Sea cual sea el resultado, el saldo se refresca: la línea pasa a «En disputa» o el plazo ya se cerró. */
export function useOpenDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { surchargeId: string; reason: string }) => openDispute(input.surchargeId, input.reason),
    onSettled: () => queryClient.invalidateQueries({ queryKey: myBalanceKey }),
  })
}

export function useOrderTracking(order: CustomerOrder) {
  return useQuery({
    queryKey: ['customer-order-tracking', order.id],
    queryFn: ({ signal }) => getOrderTracking(order.id, signal),
    enabled: isOnTheWay(order.status) && !isDemoMode(),
    refetchInterval: (query) => query.state.data && !isOnTheWay(query.state.data.status) ? false : 5_000,
    retry: false,
  })
}

export function useEditOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: DeliveryEdit }) => editOrder(id, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData<CustomerOrder[]>(myOrdersKey, (current) =>
        current?.map((order) => order.id === updated.id ? updated : order))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: myOrdersKey }),
  })
}
