import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { reviewOrder } from '@/features/orders/api'
import { formatDate, formatWindow } from '@/features/orders/format'
import { OrderDetailsFields } from '@/features/orders/OrderDetailsFields'
import {
  reviewActionValues,
  reviewReasonLabels,
  type Order,
  type OrderReviewInput,
  type ReviewAction,
} from '@/features/orders/types'
import { localToday, validateNewOrder, type OrderErrors, type OrderFields } from '@/features/orders/validation'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, fieldLabelClass, inputClass } from '@/shared/ui/form'

const MIN_REASON_LENGTH = 5

const reviewActionLabels: Record<ReviewAction, string> = {
  CONFIRM: 'Confirmar',
  CORRECT: 'Corregir',
  REJECT: 'Rechazar',
}

const reviewActionHints: Record<ReviewAction, string> = {
  CONFIRM: 'Confirma el pedido con los datos actuales.',
  CORRECT: 'Ajusta la dirección, la fecha o la ventana y guarda la corrección.',
  REJECT: 'El pedido no se atiende. El motivo queda registrado.',
}

type ReviewErrors = OrderErrors & { reason?: string }

export interface ReviewPanelProps {
  order: Order
  onDecided: (action: ReviewAction) => void
  onCancel: () => void
}

/**
 * Decisión del operador sobre un pedido en revisión (ADR 0007, sección 3):
 * confirmar, corregir o rechazar, siempre con motivo.
 */
export function ReviewPanel({ order, onDecided, onCancel }: ReviewPanelProps) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<ReviewAction>('CONFIRM')
  const [reason, setReason] = useState('')
  const [fields, setFields] = useState<OrderFields>({
    address: order.address,
    deliveryDate: order.deliveryDate,
    windowStart: order.windowStart,
    windowEnd: order.windowEnd,
  })
  const [errors, setErrors] = useState<ReviewErrors>({})

  const mutation = useMutation({
    mutationFn: (input: OrderReviewInput) => reviewOrder(order.id, input),
    onSuccess: (_updated, input) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      onDecided(input.action)
    },
  })

  const update = (key: keyof OrderFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedReason = reason.trim()
    const found: ReviewErrors =
      action === 'CORRECT'
        ? validateNewOrder(
            { ...fields, address: fields.address.trim(), location: { latitude: order.latitude, longitude: order.longitude } },
            localToday(),
          )
        : {}
    if (trimmedReason.length < MIN_REASON_LENGTH) {
      found.reason = `Escribe el motivo de la decisión (mínimo ${String(MIN_REASON_LENGTH)} caracteres).`
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    mutation.mutate(
      action === 'CORRECT'
        ? {
            action,
            reason: trimmedReason,
            correction: {
              address: fields.address.trim(),
              deliveryDate: fields.deliveryDate,
              windowStart: fields.windowStart,
              windowEnd: fields.windowEnd,
            },
          }
        : { action, reason: trimmedReason },
    )
  }

  const isPending = mutation.isPending

  return (
    <section
      aria-labelledby="review-title"
      className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 p-space-lg"
    >
      <div className="pb-3 border-b border-surface-container-low">
        <h2 id="review-title" className="text-sm font-bold text-on-surface">Revisar pedido</h2>
        <p className="text-[12px] text-on-surface">
          {order.address} · {formatDate(order.deliveryDate)} · {formatWindow(order.windowStart, order.windowEnd)}
        </p>
        <ul className="flex flex-wrap gap-1 pt-1">
          {order.reviewReasons.map((reviewReason) => (
            <li key={reviewReason} className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
              {reviewReasonLabels[reviewReason]}
            </li>
          ))}
        </ul>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3" noValidate onSubmit={onSubmit}>
        <fieldset className="lg:col-span-2 flex flex-col gap-2">
          <legend className={fieldLabelClass}>Decisión *</legend>
          {reviewActionValues.map((value) => (
            <label key={value} className="flex items-start gap-2 text-[12px] text-on-surface">
              <input
                type="radio"
                name="review-action"
                value={value}
                checked={action === value}
                disabled={isPending}
                onChange={() => { setAction(value); }}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold">{reviewActionLabels[value]}</span>
                <span className="block text-[10px] text-on-surface-variant">{reviewActionHints[value]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="lg:col-span-2 flex flex-col gap-1">
          <label className={fieldLabelClass} htmlFor="review-reason">Motivo *</label>
          <textarea
            id="review-reason"
            aria-describedby={errors.reason ? 'review-reason-error' : undefined}
            aria-invalid={errors.reason ? true : undefined}
            className={`${inputClass} min-h-[72px]`}
            disabled={isPending}
            maxLength={300}
            onChange={(e) => { setReason(e.target.value); }}
            value={reason}
          />
          {errors.reason ? <ErrorMessage id="review-reason-error">{errors.reason}</ErrorMessage> : null}
        </div>

        {action === 'CORRECT' ? (
          <OrderDetailsFields idPrefix="review" values={fields} errors={errors} disabled={isPending} onChange={update} />
        ) : null}

        {mutation.isError ? (
          <div role="alert" className="lg:col-span-2 bg-error-container text-on-error-container rounded-lg px-3 py-2 text-[11px]">
            No se pudo registrar la decisión. {userMessage(mutation.error)} Inténtalo de nuevo.
          </div>
        ) : null}

        <div className="lg:col-span-2 flex items-center justify-end gap-2 pt-1">
          <button
            className="px-3 py-2 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-3 py-2 rounded-lg shadow-md text-[11px] font-semibold cursor-pointer disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Guardando…' : 'Guardar decisión'}
          </button>
        </div>
      </form>
    </section>
  )
}
