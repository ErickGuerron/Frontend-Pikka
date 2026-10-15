import { useState, type SyntheticEvent } from 'react'
import { AddressPicker } from '@/features/geo/AddressPicker'
import type { Place } from '@/features/geo/photon'
import { localToday, validateNewOrder, type OrderErrors } from '@/features/orders/validation'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, fieldLabelClass, inputClass } from '@/shared/ui/form'
import { useCreateOrder } from './hooks'
import { Modal } from './Modal'
import { deliveryWindows, type CustomerOrder } from './types'

interface NewOrderDialogProps {
  onClose: () => void
  onCreated: (order: CustomerOrder) => void
}

const MAX_NOTES = 280

/** Create-order form: address (required), optional map pin, date (>= today), window chips and optional notes. */
export function NewOrderDialog({ onClose, onCreated }: NewOrderDialogProps) {
  const create = useCreateOrder()
  const [place, setPlace] = useState<Place | null>(null)
  const [address, setAddress] = useState('')
  const [autoAddress, setAutoAddress] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [windowStart, setWindowStart] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<OrderErrors>({})

  const windowEnd = deliveryWindows.find((w) => w.start === windowStart)?.end ?? ''

  const onPlace = (next: Place | null) => {
    setPlace(next)
    // Keep the typed address unless it is empty or still the one filled from the map.
    const suggested = next?.address || next?.name || ''
    if (address === '' || address === autoAddress) setAddress(suggested)
    setAutoAddress(suggested)
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const location = place === null ? null : { latitude: place.latitude, longitude: place.longitude }
    const fields = { address: address.trim(), deliveryDate, windowStart, windowEnd }
    const found = validateNewOrder({ ...fields, location }, localToday())
    setErrors(found)
    if (Object.keys(found).length > 0) return
    create.mutate(
      { ...fields, ...(location ?? {}), ...(notes.trim() === '' ? {} : { notes: notes.trim() }) },
      { onSuccess: onCreated },
    )
  }

  const windowError = errors.windowStart ?? errors.windowEnd ? 'Elige una ventana de entrega.' : undefined

  return (
    <Modal title="Hacer nuevo pedido" titleId="new-order-title" onClose={onClose} wide>
      <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <span className={fieldLabelClass}>Punto en el mapa (opcional)</span>
          <AddressPicker value={place} onChange={onPlace} />
          {errors.location ? <ErrorMessage>{errors.location}</ErrorMessage> : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className={fieldLabelClass} htmlFor="new-order-address">
            Dirección de entrega *
          </label>
          <input
            id="new-order-address"
            className={inputClass}
            aria-invalid={errors.address ? true : undefined}
            placeholder="Calle, número y referencia"
            value={address}
            onChange={(e) => { setAddress(e.target.value) }}
          />
          {errors.address ? <ErrorMessage>{errors.address}</ErrorMessage> : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className={fieldLabelClass} htmlFor="new-order-date">
            Fecha de entrega *
          </label>
          <input
            id="new-order-date"
            type="date"
            min={localToday()}
            className={inputClass}
            aria-invalid={errors.deliveryDate ? true : undefined}
            value={deliveryDate}
            onChange={(e) => { setDeliveryDate(e.target.value) }}
          />
          {errors.deliveryDate ? <ErrorMessage>{errors.deliveryDate}</ErrorMessage> : null}
        </div>

        <div role="radiogroup" aria-label="Ventana de entrega" className="flex flex-col gap-1">
          <span className={fieldLabelClass}>Ventana de entrega *</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {deliveryWindows.map((w) => (
              <button
                key={w.start}
                type="button"
                role="radio"
                aria-checked={windowStart === w.start}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                  windowStart === w.start
                    ? 'border-primary bg-primary text-white'
                    : 'border-surface-container-high bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                onClick={() => { setWindowStart(w.start) }}
              >
                {w.label}
              </button>
            ))}
          </div>
          {windowError ? <ErrorMessage>{windowError}</ErrorMessage> : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className={fieldLabelClass} htmlFor="new-order-notes">
            Notas (opcional)
          </label>
          <textarea
            id="new-order-notes"
            rows={2}
            maxLength={MAX_NOTES}
            className={inputClass}
            value={notes}
            onChange={(e) => { setNotes(e.target.value) }}
          />
          <p className="text-[10px] text-on-surface-variant">
            Las notas aún no se envían al servicio; se usarán cuando el contrato las admita.
          </p>
        </div>

        {create.isError ? (
          <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
            No se pudo crear el pedido. {userMessage(create.error)}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {create.isPending ? 'Creando…' : 'Crear pedido'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
