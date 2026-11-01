import { ApiError } from '../../api/errors'

export const minDisputeReason = 5
export const maxDisputeReason = 300

/** null when the reason can be sent; otherwise what to tell the customer. The server checks it again. */
export function validateDisputeReason(reason: string): string | null {
  const length = reason.trim().length
  if (length < minDisputeReason || length > maxDisputeReason) {
    return `El motivo debe tener entre ${String(minDisputeReason)} y ${String(maxDisputeReason)} caracteres.`
  }
  return null
}

/** What the customer is told when a dispute fails: 422 out of time or already paid, 409 already disputed. */
export function disputeErrorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 422) return 'El plazo para disputar este recargo ya terminó o ya está pagado.'
  if (error instanceof ApiError && error.status === 409) return 'Este recargo ya tiene una disputa.'
  return 'No pudimos enviar tu disputa. Inténtalo de nuevo.'
}
