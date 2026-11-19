import { describe, expect, it } from 'vitest'
import { userMessage } from '@/shared/api/errors'
import { routingErrorMessage } from './api'
import { generateDemoRoutePlan } from './demo'
import { parseRoutePlan } from './types'

describe('rutas: errores y datos de muestra', () => {
  it('un error que no es de la API se traduce con el mensaje general', () => {
    const failure = new Error('boom')

    expect(routingErrorMessage(failure)).toBe(userMessage(failure))
  })

  it('el plan de muestra tiene dos rutas y un pedido sin asignar, y es un plan válido', async () => {
    const demo = await generateDemoRoutePlan()

    expect(parseRoutePlan(demo)).toEqual(demo)
    expect(demo.routes.map((route) => route.id)).toEqual(['route-1', 'route-2'])
    expect(demo.unassignedOrderIds).toEqual(['o-4'])
  })
})
