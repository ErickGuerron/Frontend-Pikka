import { describe, expect, it } from 'vitest'
import { notificationDetail, notificationTitle, parseNotifications, type CustomerNotification } from './notifications'

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

  it('ignora un tipo de aviso desconocido en vez de fallar', () => {
    expect(parseNotifications({ notifications: [{ ...base, kind: 'ORDER_DELETED', detail: '' }] })).toEqual([])
  })

  it('un aviso mal formado de un tipo conocido sí es un error', () => {
    expect(() => parseNotifications({ notifications: [{ ...base, kind: 'ORDER_CONFIRMED' }] })).toThrow()
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

describe('avisos del recargo y del bloqueo (ADR 0006)', () => {
  const notice = (kind: CustomerNotification['kind'], detail: string, orderId = 'o-1'): CustomerNotification => ({ ...base, kind, detail, orderId })

  it('acepta los dos tipos nuevos y el aviso de bloqueo sin pedido', () => {
    const list = parseNotifications({
      notifications: [
        { ...base, kind: 'SURCHARGE_APPLIED', detail: 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z' },
        { ...base, id: 'n-2', orderId: '', kind: 'ACCOUNT_BLOCKED_BY_BALANCE', detail: '' },
      ],
    })
    expect(list.map((n) => n.kind)).toEqual(['SURCHARGE_APPLIED', 'ACCOUNT_BLOCKED_BY_BALANCE'])
    expect(list[1]?.orderId).toBe('')
  })

  it('tiene un título propio para cada tipo nuevo', () => {
    expect(notificationTitle('SURCHARGE_APPLIED')).toBe('Se aplicó un recargo a tu cuenta')
    expect(notificationTitle('ACCOUNT_BLOCKED_BY_BALANCE')).toBe('Tu cuenta quedó bloqueada por saldo pendiente')
  })

  it('traduce el recargo: motivo legible, monto y fecha límite', () => {
    expect(notificationDetail(notice('SURCHARGE_APPLIED', 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z'))).toBe(
      'Rechazaste el pedido en la entrega: $3.00. Pagar antes del 15/10/2026.',
    )
    expect(notificationDetail(notice('SURCHARGE_APPLIED', 'WRONG_ADDRESS,1.50,2026-10-24T08:00:00Z'))).toBe(
      'La dirección del pedido era incorrecta: $1.50. Pagar antes del 24/10/2026.',
    )
  })

  it('un motivo desconocido no muestra el código crudo', () => {
    const text = notificationDetail(notice('SURCHARGE_APPLIED', 'CODIGO_NUEVO,3.00,2026-10-15T08:00:00Z'))
    expect(text).toBe('Recargo por una entrega no realizada: $3.00. Pagar antes del 15/10/2026.')
    expect(text).not.toContain('CODIGO')
  })

  it.each(['', 'CLIENT_REFUSED', 'CLIENT_REFUSED,3.00', 'CLIENT_REFUSED,3.00,2026-10-15T08:00:00Z,extra'])(
    'un detalle mal formado (%j) no muestra texto crudo',
    (detail) => {
      expect(notificationDetail(notice('SURCHARGE_APPLIED', detail))).toBe('')
    },
  )

  it('el bloqueo explica cómo salir de él, sin depender del detalle', () => {
    const text = 'Paga tu saldo para volver a crear y cancelar pedidos.'
    expect(notificationDetail(notice('ACCOUNT_BLOCKED_BY_BALANCE', ''))).toBe(text)
    expect(notificationDetail(notice('ACCOUNT_BLOCKED_BY_BALANCE', 'texto inesperado'))).toBe(text)
  })

  it('los avisos de pedido de siempre no cambian', () => {
    expect(notificationDetail(notice('ORDER_REJECTED', 'Dirección imposible de ubicar'))).toBe('Dirección imposible de ubicar')
  })
})
