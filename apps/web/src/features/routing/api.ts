import { http } from '@/shared/api/client'
import { ApiError, userMessage } from '@/shared/api/errors'
import { generateDemoRoutePlan } from './demo'
import { type AddedStop, parseAddedStop, parseGeneratedRoutePlan, type RoutePlan } from './types'

/**
 * Routes are served by the Gateway (ADMIN and OPERATOR):
 *   POST /api/v1/routes/plan             {deliveryDate, dryRun?}  plan the PENDING orders of a date
 *   POST /api/v1/routes/{routeId}/orders {orderId}                put a PENDING order on a running route
 * VITE_MOCK_ROUTING=true uses a demo plan.
 */
export function isRoutingDemoMode(): boolean {
  return import.meta.env.VITE_MOCK_ROUTING === 'true'
}

/**
 * Proposes the routes of one delivery date (YYYY-MM-DD) without changing anything: no driver is reserved and
 * no order is assigned. A route with no driver left comes back with an empty driverId.
 */
export function previewRoutePlan(deliveryDate: string): Promise<RoutePlan> {
  if (isRoutingDemoMode()) return generateDemoRoutePlan()
  return http.post('/api/v1/routes/plan', parseGeneratedRoutePlan, { body: { deliveryDate, dryRun: true } })
}

/** Confirms the plan: reserves a driver per route and assigns the orders. It plans again with the current state. */
export function generateRoutePlan(deliveryDate: string): Promise<RoutePlan> {
  if (isRoutingDemoMode()) return generateDemoRoutePlan()
  return http.post('/api/v1/routes/plan', parseGeneratedRoutePlan, { body: { deliveryDate } })
}

/** Puts a PENDING order at the end of a route that is still running. The server validates zone, date and capacity. */
export function addOrderToRoute(routeId: string, orderId: string): Promise<AddedStop> {
  if (isRoutingDemoMode()) return Promise.resolve({ routeId, stop: { orderId, address: `Pedido ${orderId}`, sequence: 99 } })
  return http.post(`/api/v1/routes/${encodeURIComponent(routeId)}/orders`, parseAddedStop, { body: { orderId } })
}

/** Por qué el Routing Service rechazó sumar el pedido (FAILED_PRECONDITION). Sin pista clara, la lista de causas. */
function addRejectionMessage(serverMessage: string): string {
  if (serverMessage.includes('maximum capacity')) return 'La ruta ya está llena: tiene el máximo de pedidos que permite su zona.'
  if (serverMessage.includes('no open stops')) return 'La ruta ya terminó todas sus paradas.'
  if (serverMessage.includes('another zone')) return 'El pedido es de otra zona que la ruta.'
  if (serverMessage.includes('not pending')) return 'El pedido ya no está pendiente: otra persona lo asignó o lo canceló.'
  return 'No se pudo agregar: el pedido ya no está pendiente, es de otra zona, o la ruta terminó o está llena.'
}

/** Mensaje para el operador según el error y la acción. Un 409 significa que otro proceso cambió el plan. */
export function routingErrorMessage(error: unknown, action: 'generate' | 'add' = 'generate'): string {
  if (error instanceof ApiError) {
    if (action === 'add' && error.status === 404) return 'La ruta ya no tiene pedidos para la fecha de este pedido. Actualiza la pantalla.'
    if (action === 'add' && error.status === 422) return addRejectionMessage(error.message)
    if (action === 'generate' && error.status === 422) {
      return 'No hay repartidores disponibles para alguna de las rutas. Revisa la flota e inténtalo de nuevo.'
    }
    if (error.status === 409 && action === 'generate') {
      return 'Otro proceso está asignando repartidores al mismo tiempo. Vuelve a generar las rutas en unos segundos.'
    }
    if ([0, 404, 501, 502, 503, 504].includes(error.status)) return 'El servicio de rutas aún no está disponible.'
  }
  return userMessage(error)
}
