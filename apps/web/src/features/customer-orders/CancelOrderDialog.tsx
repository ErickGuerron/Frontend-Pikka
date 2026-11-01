import { ApiError } from '@/shared/api/errors'
import { cancelBlockedMessage } from './balance'
import { useCancelOrder } from './hooks'
import { Modal } from './Modal'
import { orderCode, type CustomerOrder } from './types'

interface CancelOrderDialogProps {
  order: CustomerOrder
  onClose: () => void
}

function cancelErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return 'Este pedido ya no se puede cancelar porque su estado cambió.'
  }
  // El servidor rechaza con 403 cancelar a una cuenta bloqueada por saldo (ADR 0006).
  if (error instanceof ApiError && error.status === 403) return cancelBlockedMessage
  return 'No pudimos cancelar el pedido. Inténtalo de nuevo.'
}

/** Confirmation before cancelling; only offered for PENDING and ROUTE_ASSIGNED orders. */
export function CancelOrderDialog({ order, onClose }: CancelOrderDialogProps) {
  const cancel = useCancelOrder()

  return (
    <Modal title={`¿Cancelar el pedido ${orderCode(order.id)}?`} titleId="cancel-order-title" onClose={onClose}>
      <p className="text-sm text-on-surface-variant">
        Solo puedes cancelar un pedido antes de que sea recogido. Esta acción no se puede deshacer.
      </p>
      {cancel.isError ? (
        <p role="alert" className="mt-3 rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
          {cancelErrorMessage(cancel.error)}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
          onClick={onClose}
        >
          Volver
        </button>
        <button
          type="button"
          disabled={cancel.isPending}
          className="cursor-pointer rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={() => { cancel.mutate(order.id, { onSuccess: onClose }) }}
        >
          {cancel.isPending ? 'Cancelando…' : 'Sí, cancelar pedido'}
        </button>
      </div>
    </Modal>
  )
}
