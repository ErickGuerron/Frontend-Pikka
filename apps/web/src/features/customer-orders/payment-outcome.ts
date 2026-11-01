import { ApiError } from '@/shared/api/errors'
import type { BalancePayment } from './balance'

export type Tone = 'ok' | 'warn'

/** Lo que se le dice al cliente tras intentar pagar su saldo. */
export interface Outcome {
  tone: Tone
  text: string
}

/** Resultado de un pago que el servidor contestó (la tarjeta simulada puede aprobar o rechazar). */
export function outcomeOfPayment(payment: BalancePayment): Outcome {
  if (payment.status === 'SIMULATED_DECLINED') {
    return { tone: 'warn', text: 'La tarjeta simulada rechazó el pago. No se cambió tu saldo; puedes intentarlo de nuevo.' }
  }
  return { tone: 'ok', text: payment.unblocked ? 'Pago simulado aprobado. Tu cuenta ya está activa.' : 'Pago simulado aprobado.' }
}

/** Mensaje de un pago que falló: 422 no debe nada, 409 el saldo cambió y el cobro se devolvió. */
export function outcomeOfError(error: unknown): Outcome {
  if (error instanceof ApiError && error.status === 422) return { tone: 'warn', text: 'No tienes saldo pendiente por pagar.' }
  if (error instanceof ApiError && error.status === 409) {
    return { tone: 'warn', text: 'Tu saldo cambió mientras pagabas. El cobro simulado se devolvió; revisa tu saldo e inténtalo de nuevo.' }
  }
  return { tone: 'warn', text: 'No pudimos procesar el pago. Inténtalo de nuevo.' }
}
