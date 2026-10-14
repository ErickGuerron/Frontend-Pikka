import { describe, expect, it } from 'vitest'
import { notificationDetail, parseNotifications, type CustomerNotification } from './notifications'

const base = {
  id: 'n-1',
  orderId: 'o-1',
  createdAt: '2030-04-10T15:00:00Z',
  read: false,
}

describe('parseNotifications', () => {
  it('acepta el sobre del Gateway y valida el tipo de aviso', () => {
    const list = parseNotifications({ notifications: [{ ...base, kind: 'ORDER_CONFIRMED', detail: 'Cliente verificado' }] })
    expect(list).toHaveLength(1)
    expect(list[0]?.kind).toBe('ORDER_CONFIRMED')
  })

  it('rechaza un tipo de aviso desconocido', () => {
    expect(() => parseNotifications({ notifications: [{ ...base, kind: 'ORDER_DELETED', detail: '' }] })).toThrow()
  })

  it('exige el campo read como booleano', () => {
    expect(() => parseNotifications({ notifications: [{ ...base, read: 'no', kind: 'ORDER_REJECTED', detail: 'x' }] })).toThrow(/read/)
  })

  it('rechaza una respuesta sin el sobre notifications', () => {
    expect(() => parseNotifications([])).toThrow()
  })
})

describe('notificationDetail', () => {
  const notice = (kind: CustomerNotification['kind'], detail: string): CustomerNotification => ({ ...base, kind, detail })

  it('traduce los motivos de revisión a texto legible', () => {
    expect(notificationDetail(notice('ORDER_IN_REVIEW', 'ZONE_NOT_COVERED, CUSTOMER_BLOCKED'))).toBe(
      'Fuera de una zona atendida, Cliente bloqueado',
    )
  })

  it('descarta motivos desconocidos en vez de mostrar códigos crudos', () => {
    expect(notificationDetail(notice('ORDER_IN_REVIEW', 'ZONE_NOT_COVERED, CODIGO_NUEVO'))).toBe('Fuera de una zona atendida')
  })

  it('muestra tal cual el motivo de auditoría del operador', () => {
    expect(notificationDetail(notice('ORDER_REJECTED', 'Dirección imposible de ubicar'))).toBe('Dirección imposible de ubicar')
  })
})
