import { useState, type SyntheticEvent } from 'react'
import { AddressPicker } from '@/features/geo/AddressPicker'
import type { Place } from '@/features/geo/photon'
import { OrderContactFields } from '@/features/orders/OrderContactFields'
import { localToday } from '@/features/orders/validation'
import { ApiError, userMessage } from '@/shared/api/errors'
import { fieldLabelClass, inputClass } from '@/shared/ui/form'
import { deliveryChanges, type DeliveryDetails } from '../../../../shared/customer-orders/edit'
import { useEditOrder } from './hooks'
import { Modal } from './Modal'
import type { CustomerOrder } from './types'

export function EditOrderDialog({ order, onClose }: { order: CustomerOrder; onClose: () => void }) {
  const [original] = useState<DeliveryDetails>(() => ({
    address: order.address,
    location: { latitude: order.latitude, longitude: order.longitude },
    deliveryDate: order.deliveryDate,
    windowStart: order.windowStart,
    windowEnd: order.windowEnd,
    addressReference: order.addressReference ?? '',
    postalCode: order.postalCode ?? '',
    contactPhone: order.contactPhone ?? '',
  }))
  const [draft, setDraft] = useState(original)
  const [error, setError] = useState<string | null>(null)
  const edit = useEditOrder()
  const pending = order.status === 'PENDING'
  const place: Place | null = draft.location === null ? null : { ...draft.location, name: draft.address, address: draft.address }
  const setField = (key: keyof Omit<DeliveryDetails, 'location'>, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }
  const save = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const changes = deliveryChanges(original, draft, pending)
    if (changes === null) {
      setError('Marca el punto de entrega en el mapa.')
      return
    }
    if (Object.keys(changes).length === 0) {
      onClose()
      return
    }
    setError(null)
    edit.mutate({ id: order.id, changes }, {
      onSuccess: onClose,
      onError: (failure) => {
        setError(failure instanceof ApiError && [409, 422].includes(failure.status) ? failure.message : userMessage(failure))
      },
    })
  }
  const close = () => { if (!edit.isPending) onClose() }

  return (
    <Modal title="Editar pedido" titleId="edit-order-title" onClose={close} wide={pending}>
      <form onSubmit={save} className="space-y-4">
        {pending ? (
          <>
            <AddressPicker
              value={place}
              onChange={(next) => {
                setDraft((previous) => ({
                  ...previous,
                  location: next === null ? null : { latitude: next.latitude, longitude: next.longitude },
                  address: next === null ? previous.address : next.address || next.name || previous.address,
                }))
              }}
              mapClassName="h-56 w-full rounded-xl z-0"
              showSelection={false}
            />
            <label className={fieldLabelClass}>
              Dirección de entrega
              <input className={inputClass} value={draft.address} onChange={(event) => { setField('address', event.target.value) }} />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className={fieldLabelClass}>
                Fecha de entrega
                <input className={inputClass} type="date" min={localToday()} value={draft.deliveryDate} onChange={(event) => { setField('deliveryDate', event.target.value) }} />
              </label>
              <label className={fieldLabelClass}>
                Inicio de ventana
                <input className={inputClass} type="time" value={draft.windowStart} onChange={(event) => { setField('windowStart', event.target.value) }} />
              </label>
              <label className={fieldLabelClass}>
                Fin de ventana
                <input className={inputClass} type="time" value={draft.windowEnd} onChange={(event) => { setField('windowEnd', event.target.value) }} />
              </label>
            </div>
          </>
        ) : null}
        <OrderContactFields idPrefix="edit-order" values={draft} errors={{}} disabled={edit.isPending} onChange={setField} />
        {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={edit.isPending} onClick={close} className="rounded-lg px-4 py-2 text-sm font-semibold text-primary">Cerrar</button>
          <button type="submit" disabled={edit.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {edit.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
