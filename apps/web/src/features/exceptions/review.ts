import type { Order, ReviewAction } from '@/features/orders/types'

/** Aviso que ve el personal tras decidir sobre un pedido en revisión. */
export const decisionMessages: Record<ReviewAction, string> = {
  CONFIRM: 'Pedido confirmado.',
  CORRECT: 'Pedido corregido y guardado.',
  REJECT: 'Pedido rechazado.',
}

/**
 * Problemas de lugar: un pedido así no se confirma tal cual (sin zona o sin ubicar no se puede
 * rutear). El backend lo rechaza con 422; la pantalla lo evita antes de enviar.
 */
export function isSpatialReview(order: Pick<Order, 'reviewReasons'>): boolean {
  return order.reviewReasons.some((reason) => reason === 'ZONE_NOT_COVERED' || reason === 'ADDRESS_NOT_LOCATED')
}
