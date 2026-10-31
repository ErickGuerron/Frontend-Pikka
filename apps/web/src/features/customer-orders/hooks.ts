import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelOrder, createOrder, getMyBalance, isDemoMode, listMyNotifications, listMyOrders, openDispute, payMyBalance } from './api'
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
