import { http } from '@/shared/api/client'
import { ApiError, userMessage } from '@/shared/api/errors'
import { generateDemoRoutePlan } from './demo'
import { parseRoutePlan, type RoutePlan } from './types'

/**
 * PLANNED, NOT IMPLEMENTED: POST /api/v1/route-plans/generate is not served by the Gateway yet.
 * VITE_MOCK_ROUTING=true swaps in a demo plan.
 */
export function isRoutingDemoMode(): boolean {
  return import.meta.env.VITE_MOCK_ROUTING === 'true'
}

export function generateRoutePlan(): Promise<RoutePlan> {
  if (isRoutingDemoMode()) return generateDemoRoutePlan()
  return http.post('/api/v1/route-plans/generate', parseRoutePlan)
}

/** Mensaje para el operador según el error. Un 409 significa que otro proceso asignó al mismo tiempo. */
export function routingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Otro proceso está asignando repartidores al mismo tiempo. Vuelve a generar las rutas en unos segundos.'
    if ([0, 404, 501, 502, 503, 504].includes(error.status)) return 'El servicio de rutas aún no está disponible.'
  }
  return userMessage(error)
}
