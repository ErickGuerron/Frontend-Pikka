import { useRef, useState } from 'react'
import { useDialog } from '@/shared/ui/dialog'
import type { Order, ReviewAction } from '@/features/orders/types'
import { ReviewPanel } from './ReviewPanel'

interface ReviewDialogProps {
  order: Order
  onDecided: (action: ReviewAction) => void
  onClose: () => void
}

/**
 * Modal de revisión de un pedido en excepción: confirmar (aprobar), corregir o rechazar con motivo.
 * Escape, el fondo y Cancelar lo cierran, salvo mientras se envía la decisión.
 */
export function ReviewDialog({ order, onDecided, onClose }: ReviewDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  useDialog(dialogRef, dialogRef, onClose, busy)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#002628]/60 backdrop-blur-xs sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#cce7ea] bg-white p-6 shadow-2xl outline-none sm:max-w-2xl sm:rounded-xl"
      >
        <ReviewPanel embedded order={order} onDecided={onDecided} onCancel={onClose} onBusyChange={setBusy} />
      </div>
    </div>
  )
}
