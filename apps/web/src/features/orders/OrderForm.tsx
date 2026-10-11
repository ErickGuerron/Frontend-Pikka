import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { userMessage } from '@/shared/api/errors'
import { createOrder } from './api'
import type { NewOrder, Order } from './types'
import { localToday, validateNewOrder, type OrderErrors } from './validation'

interface OrderFormProps {
  onCancel: () => void
  onCreated: (order: Order) => void
}

const emptyOrder: NewOrder = { address: '', deliveryDate: '', windowStart: '', windowEnd: '' }

const inputClass =
  'w-full bg-surface-container-low border border-surface-container-high rounded-lg px-3 py-2 text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 aria-[invalid=true]:border-error'

export function OrderForm({ onCancel, onCreated }: OrderFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<NewOrder>(emptyOrder)
  const [errors, setErrors] = useState<OrderErrors>({})

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      onCreated(order)
    },
  })

  const update = (key: keyof NewOrder, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input: NewOrder = { ...form, address: form.address.trim() }
    const found = validateNewOrder(input, localToday())
    setErrors(found)
    if (Object.keys(found).length > 0) return
    mutation.mutate(input)
  }

  const isPending = mutation.isPending

  return (
    <section
      aria-labelledby="order-form-title"
      className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(19,42,47,0.06)] border border-surface-container-high/60 p-space-lg"
    >
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-surface-container-low">
        <div>
          <h2 id="order-form-title" className="text-sm font-bold text-on-surface">
            Registrar pedido
          </h2>
          <p className="text-[11px] text-on-surface-variant">
            Indica dónde y cuándo se entrega. Los campos marcados con * son obligatorios.
          </p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3" noValidate onSubmit={onSubmit}>
        <div className="lg:col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="order-address">
            Dirección de entrega *
          </label>
          <input
            id="order-address"
            aria-describedby={errors.address ? 'order-address-error' : 'order-address-help'}
            aria-invalid={errors.address ? true : undefined}
            className={inputClass}
            disabled={isPending}
            onChange={(e) => { update('address', e.target.value); }}
            placeholder="Calle, número, colonia y referencia"
            type="text"
            value={form.address}
          />
          {errors.address ? (
            <p id="order-address-error" className="text-[11px] text-error">{errors.address}</p>
          ) : (
            <p id="order-address-help" className="text-[10px] text-on-surface-variant">Incluye referencias para el repartidor.</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="order-date">
            Fecha de entrega *
          </label>
          <input
            id="order-date"
            aria-describedby={errors.deliveryDate ? 'order-date-error' : undefined}
            aria-invalid={errors.deliveryDate ? true : undefined}
            className={inputClass}
            disabled={isPending}
            min={localToday()}
            onChange={(e) => { update('deliveryDate', e.target.value); }}
            type="date"
            value={form.deliveryDate}
          />
          {errors.deliveryDate ? <p id="order-date-error" className="text-[11px] text-error">{errors.deliveryDate}</p> : null}
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Ventana aproximada *</legend>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-on-surface-variant" htmlFor="order-window-start">Desde</label>
              <input
                id="order-window-start"
                aria-describedby={errors.windowStart ? 'order-window-start-error' : undefined}
                aria-invalid={errors.windowStart ? true : undefined}
                className={inputClass}
                disabled={isPending}
                onChange={(e) => { update('windowStart', e.target.value); }}
                type="time"
                value={form.windowStart}
              />
              {errors.windowStart ? <p id="order-window-start-error" className="text-[11px] text-error">{errors.windowStart}</p> : null}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-on-surface-variant" htmlFor="order-window-end">Hasta</label>
              <input
                id="order-window-end"
                aria-describedby={errors.windowEnd ? 'order-window-end-error' : undefined}
                aria-invalid={errors.windowEnd ? true : undefined}
                className={inputClass}
                disabled={isPending}
                onChange={(e) => { update('windowEnd', e.target.value); }}
                type="time"
                value={form.windowEnd}
              />
              {errors.windowEnd ? <p id="order-window-end-error" className="text-[11px] text-error">{errors.windowEnd}</p> : null}
            </div>
          </div>
        </fieldset>

        {mutation.isError ? (
          <div role="alert" className="lg:col-span-2 bg-error-container text-on-error-container rounded-lg px-3 py-2 text-[11px]">
            No se pudo registrar el pedido. {userMessage(mutation.error)} Revisa los datos e inténtalo de nuevo.
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
            className="flex items-center gap-1 bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-3 py-2 rounded-lg shadow-md text-[11px] font-semibold cursor-pointer disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add_box</span>
            <span>{isPending ? 'Registrando…' : 'Registrar pedido'}</span>
          </button>
        </div>
      </form>
    </section>
  )
}
