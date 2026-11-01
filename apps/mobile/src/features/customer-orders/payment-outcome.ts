import { ApiError } from '../../api/errors'
import type { BalancePayment } from './balance'

export type Tone = 'ok' | 'warn'

/** What the customer is told after trying to pay the balance. */
export interface Outcome {
  tone: Tone
  text: string
}

/** Result of a payment the server answered (the simulated card can approve or decline). */
export function outcomeOfPayment(payment: BalancePayment): Outcome {
  if (payment.status === 'SIMULATED_DECLINED') {
    return { tone: 'warn', text: 'La tarjeta simulada rechazó el pago. No se cambió tu saldo; puedes intentarlo de nuevo.' }
  }
  return { tone: 'ok', text: payment.unblocked ? 'Pago simulado aprobado. Tu cuenta ya está activa.' : 'Pago simulado aprobado.' }
}

/** Message for a payment that failed: 422 owes nothing, 409 the balance changed and the charge was refunded. */
export function outcomeOfError(error: unknown): Outcome {
  if (error instanceof ApiError && error.status === 422) return { tone: 'warn', text: 'No tienes saldo pendiente por pagar.' }
  if (error instanceof ApiError && error.status === 409) {
    return { tone: 'warn', text: 'Tu saldo cambió mientras pagabas. El cobro simulado se devolvió; revisa tu saldo e inténtalo de nuevo.' }
  }
  return { tone: 'warn', text: 'No pudimos procesar el pago. Inténtalo de nuevo.' }
}
