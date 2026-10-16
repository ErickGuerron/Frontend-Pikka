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
import { isSpatialReview } from './review'

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
  const spatial = isSpatialReview(order)
  const [action, setAction] = useState<ReviewAction>(spatial ? 'CORRECT' : 'CONFIRM')
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
      className="bg-white rounded-xl shadow-sm border border-[#cce7ea] p-5"
    >
      <div className="pb-3.5 border-b border-[#cce7ea]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-[#004b4e]" aria-hidden="true">
            rate_review
          </span>
          <h2 id="review-title" className="text-sm font-bold text-[#004b4e] font-sans">
            Revisar pedido
          </h2>
        </div>
        <p className="mt-1 text-xs font-mono text-[#557b7f]">
          {order.address} · {formatDate(order.deliveryDate)} · {formatWindow(order.windowStart, order.windowEnd)}
        </p>
        <ul className="flex flex-wrap gap-1.5 pt-2">
          {order.reviewReasons.map((reviewReason) => (
            <li
              key={reviewReason}
              className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
            >
              {reviewReasonLabels[reviewReason]}
            </li>
          ))}
        </ul>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-4" noValidate onSubmit={onSubmit}>
        <fieldset className="lg:col-span-2 flex flex-col gap-2">
          <legend className={fieldLabelClass}>Decisión *</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {reviewActionValues.map((value) => {
              const isSelected = action === value
              const isDisabled = isPending || (value === 'CONFIRM' && spatial)
              return (
                <label
                  key={value}
                  className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                      : isSelected
                      ? 'bg-[#e8f7f9] border-[#004b4e] shadow-xs ring-1 ring-[#004b4e]'
                      : 'bg-white border-[#cce7ea] hover:bg-[#f0fafb]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="review-action"
                      value={value}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => { setAction(value); }}
                      className="accent-[#004b4e]"
                    />
                    <span className="font-sans font-bold text-xs text-[#061f23]">
                      {reviewActionLabels[value]}
                    </span>
                  </div>
                  <span className="text-[11px] font-sans text-[#557b7f] pl-5">
                    {value === 'CONFIRM' && spatial
                      ? 'No disponible: sin zona o sin ubicar, corrige o rechaza.'
                      : reviewActionHints[value]}
                  </span>
                </label>
              )
            })}
          </div>
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
          <div role="alert" className="lg:col-span-2 bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] rounded-lg px-3 py-2 text-[11px] font-mono">
            No se pudo registrar la decisión. {userMessage(mutation.error)} Inténtalo de nuevo.
          </div>
        ) : null}

        <div className="lg:col-span-2 flex items-center justify-end gap-2.5 pt-2 border-t border-[#cce7ea]">
          <button
            className="px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider text-[#004b4e] border border-[#cce7ea] bg-white hover:bg-[#e8f7f9] cursor-pointer transition-colors disabled:opacity-50"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="bg-[#004b4e] hover:bg-[#0a6568] text-white px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-colors disabled:opacity-50 border border-[#004b4e]"
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
