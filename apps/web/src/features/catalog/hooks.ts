import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adjustProductStock, createProduct, listProducts, listStockMovements, setProductActive, type NewProductBody, type StockAdjustmentBody } from './api'

/** Raíz de todas las consultas de productos: invalidarla refresca listas, stock e historial. */
export const productsKey = ['products'] as const

export function useProducts(includeInactive: boolean) {
  return useQuery({
    queryKey: [...productsKey, 'list', { includeInactive }],
    queryFn: ({ signal }) => listProducts(includeInactive, signal),
  })
}

export function useStockMovements(productId: string | null) {
  return useQuery({
    queryKey: [...productsKey, 'movements', productId],
    queryFn: ({ signal }) => listStockMovements(productId ?? '', signal),
    enabled: productId !== null,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewProductBody) => createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}

export function useSetProductActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setProductActive(id, active),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StockAdjustmentBody }) => adjustProductStock(id, input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}
