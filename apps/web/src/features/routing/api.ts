import { http } from '@/shared/api/client'
import { ApiError, userMessage } from '@/shared/api/errors'
import { insertUnassignedOrder, moveStop } from './adjust'
import { generateDemoRoutePlan } from './demo'
import { parseGeneratedRoutePlan, parseRoutePlan, type RoutePlan } from './types'

/**
 * Generate is served by POST /api/v1/routes/plan (ADMIN and OPERATOR). Insert and move are NOT served yet:
 * they are PLANNED and keep their demo versions when VITE_MOCK_ROUTING=true.
 *   POST  /api/v1/route-plans/{planId}/stops        insert a last-minute order (planned)
 *   PATCH /api/v1/route-plans/{planId}/stops/{orderId}  move a stop to another route
 */
export function isRoutingDemoMode(): boolean {
  return import.meta.env.VITE_MOCK_ROUTING === 'true'
}

/** Generates the routes of one delivery date (YYYY-MM-DD). The Gateway requires deliveryDate in the body. */
export function generateRoutePlan(deliveryDate: string): Promise<RoutePlan> {
  if (isRoutingDemoMode()) return generateDemoRoutePlan()
  return http.post('/api/v1/routes/plan', parseGeneratedRoutePlan, { body: { deliveryDate } })
}

/** Pedido de último momento: se inserta en la ruta indicada, sujeto a validación del servidor. */
export function insertLastMinuteOrder(plan: RoutePlan, orderId: string, toRouteId: string): Promise<RoutePlan> {
  if (isRoutingDemoMode()) return Promise.resolve(insertUnassignedOrder(plan, orderId, toRouteId, `Pedido ${orderId}`))
  return http.post(`/api/v1/route-plans/${encodeURIComponent(plan.id)}/stops`, parseRoutePlan, {
    body: { orderId, routeId: toRouteId },
  })
}

/** Ajuste manual: mueve una parada a otra ruta del mismo plan. */
export function moveRouteStop(plan: RoutePlan, orderId: string, toRouteId: string): Promise<RoutePlan> {
  if (isRoutingDemoMode()) return Promise.resolve(moveStop(plan, orderId, toRouteId))
  return http.patch(`/api/v1/route-plans/${encodeURIComponent(plan.id)}/stops/${encodeURIComponent(orderId)}`, parseRoutePlan, {
    body: { routeId: toRouteId },
  })
}

/** Mensaje para el operador según el error y la acción. Un 409 significa que otro proceso cambió el plan. */
export function routingErrorMessage(error: unknown, action: 'generate' | 'adjust' = 'generate'): string {
  if (error instanceof ApiError) {
    if (error.status === 409 && action === 'generate') {
      return 'Otro proceso está asignando repartidores al mismo tiempo. Vuelve a generar las rutas en unos segundos.'
    }
    if (error.status === 409) return 'Otro proceso cambió el plan al mismo tiempo. Actualiza las rutas y vuelve a intentarlo.'
    if ([0, 404, 501, 502, 503, 504].includes(error.status)) return 'El servicio de rutas aún no está disponible.'
  }
  return userMessage(error)
}
