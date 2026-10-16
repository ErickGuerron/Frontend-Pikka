import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { AddressPicker } from '@/features/geo/AddressPicker'
import type { Place } from '@/features/geo/photon'
import { useCoverageZones } from '@/features/geo/coverage'
import { userMessage } from '@/shared/api/errors'
import { normalizePhone } from '@/shared/validation/contact'
import { ErrorMessage, fieldLabelClass } from '@/shared/ui/form'
import { createOrder } from './api'
import { OrderDetailsFields } from './OrderDetailsFields'
import { OrderContactFields, type OrderContactValues } from './OrderContactFields'
import { OrderItemsPicker } from './OrderItemsPicker'
import type { Order, OrderLine } from './types'
import { localToday, validateNewOrder, type OrderErrors, type OrderFields } from './validation'

interface OrderFormProps {
  onCancel: () => void
  onCreated: (order: Order) => void
}

const emptyFields: OrderFields = { address: '', deliveryDate: '', windowStart: '', windowEnd: '' }
const subLabelClass = 'text-[10px] text-on-surface-variant'

export function OrderForm({ onCancel, onCreated }: OrderFormProps) {
  const queryClient = useQueryClient()
  const [fields, setFields] = useState<OrderFields>(emptyFields)
  // El lugar elegido en el mapa es la única fuente de la ubicación (latitud y longitud).
  const [place, setPlace] = useState<Place | null>(null)
  const [items, setItems] = useState<OrderLine[]>([])
  const [contact, setContact] = useState<OrderContactValues>({ addressReference: '', postalCode: '', contactPhone: '' })
  const coverage = useCoverageZones()
  const [errors, setErrors] = useState<OrderErrors>({})

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      onCreated(order)
    },
  })

  const update = (key: keyof OrderFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const location = place === null ? null : { latitude: place.latitude, longitude: place.longitude }
    const draft = { ...fields, address: fields.address.trim(), location, items, ...contact }
    const found = validateNewOrder(draft, localToday())
    setErrors(found)
    if (Object.keys(found).length > 0 || location === null) return
    mutation.mutate({
      address: draft.address,
      addressReference: contact.addressReference.trim(),
      ...(contact.postalCode.trim() === '' ? {} : { postalCode: contact.postalCode.trim() }),
      contactPhone: normalizePhone(contact.contactPhone.trim()),
      items,
      latitude: location.latitude,
      longitude: location.longitude,
      deliveryDate: draft.deliveryDate,
      windowStart: draft.windowStart,
      windowEnd: draft.windowEnd,
    })
  }

  const isPending = mutation.isPending

  return (
    <section
      aria-labelledby="order-form-title"
      className="bg-white rounded border border-[#cce7ea] shadow-sm p-6 font-sans mb-4"
    >
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#cce7ea]">
        <div>
          <h2 id="order-form-title" className="text-base font-bold text-[#004b4e] font-sans">
            Registrar pedido
          </h2>
          <p className="text-xs text-[#557b7f] font-sans mt-0.5">
            Elige los productos e indica dónde y cuándo se entrega. Los campos marcados con * son obligatorios.
          </p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3" noValidate onSubmit={onSubmit}>
        <div className="lg:col-span-2">
          <OrderItemsPicker value={items} onChange={setItems} error={errors.items} disabled={isPending} />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-1">
          <span className={fieldLabelClass}>Ubicación de entrega *</span>
          <AddressPicker value={place} onChange={setPlace} zones={coverage.data ?? []} />
          {errors.location ? (
            <ErrorMessage id="order-location-error">{errors.location}</ErrorMessage>
          ) : (
            <p className={subLabelClass}>Haz clic en el mapa o busca una calle para ubicar el punto de entrega.</p>
          )}
        </div>

        <OrderDetailsFields idPrefix="order" values={fields} errors={errors} disabled={isPending} onChange={update} />

        <div className="lg:col-span-2">
          <OrderContactFields
            idPrefix="order"
            values={contact}
            errors={errors}
            disabled={isPending}
            onChange={(key, value) => { setContact((current) => ({ ...current, [key]: value })) }}
          />
        </div>

        {mutation.isError ? (
          <div role="alert" className="lg:col-span-2 bg-[#ffdad6]/60 border border-[#ffdad6] text-[#ba1a1a] rounded-lg px-4 py-3 font-mono text-xs">
            No se pudo registrar el pedido. {userMessage(mutation.error)} Revisa los datos e inténtalo de nuevo.
          </div>
        ) : null}

        <div className="lg:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-[#cce7ea] mt-2">
          <button
            className="px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider text-[#557b7f] hover:bg-[#e8f7f9] hover:text-[#004b4e] border border-[#cce7ea] bg-white transition-colors cursor-pointer font-semibold"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="flex items-center gap-1.5 bg-[#004b4e] hover:bg-[#0a6568] text-white px-5 py-2 rounded-lg shadow-sm font-mono text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50 border border-[#004b4e]"
            disabled={isPending}
            type="submit"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">add_box</span>
            <span>{isPending ? 'Registrando…' : 'Registrar pedido'}</span>
          </button>
        </div>
      </form>
    </section>
  )
}
