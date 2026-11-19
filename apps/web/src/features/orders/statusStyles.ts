import type { OrderStatus } from './types'

/** Colores de la etiqueta de estado de un pedido. */
export const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-[#e8f7f9] text-[#004b4e] border border-[#cce7ea]',
  PENDING_REVIEW: 'bg-[#fff3e0] text-[#693600] border border-[#ffdcc3]',
  ROUTE_ASSIGNED: 'bg-[#004b4e] text-white border border-[#004b4e]',
  PICKED_UP: 'bg-[#0a6568] text-white border border-[#0a6568]',
  IN_TRANSIT: 'bg-[#002628] text-[#2dd4bf] border border-[#14b8a6]/40',
  DELIVERED: 'bg-[#e8f7f9] text-[#006b5f] border border-[#cce7ea]',
  NOT_DELIVERED: 'bg-[#ffdad6]/60 text-[#ba1a1a] border border-[#ffdad6]',
  CANCELLED: 'bg-[#ffdad6]/60 text-[#ba1a1a] border border-[#ffdad6]',
}
