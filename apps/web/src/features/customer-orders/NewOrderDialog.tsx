import { useState, type SyntheticEvent } from 'react'
import { useProducts } from '@/features/catalog/hooks'
import { useCoverageZones, zoneCovering, type CoverageZone } from '@/features/geo/coverage'
import { AddressPicker } from '@/features/geo/AddressPicker'
import type { Place } from '@/features/geo/photon'
import { OrderContactFields, type OrderContactValues } from '@/features/orders/OrderContactFields'
import { OrderItemsPicker } from '@/features/orders/OrderItemsPicker'
import type { OrderLine } from '@/features/orders/types'
import { localToday, validateNewOrder, type OrderErrors } from '@/features/orders/validation'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, fieldLabelClass, inputClass } from '@/shared/ui/form'
import { normalizePhone } from '@/shared/validation/contact'
import { useCreateOrder } from './hooks'
import { Modal } from './Modal'
import { deliveryWindows, type CustomerOrder } from './types'

interface NewOrderDialogProps {
  onClose: () => void
  onCreated: (order: CustomerOrder) => void
  initialProductId?: string | null
}

const MAX_NOTES = 280
const primaryButton =
  'cursor-pointer rounded-xl bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.98] disabled:opacity-60'
const secondaryButton = 'cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container'

type Step = 'form' | 'confirm'

/**
 * Create-order flow in two steps: the form (products, map with covered zones, editable address,
 * contact data, date and window) and a summary the customer confirms before anything is sent.
 */
export function NewOrderDialog({ onClose, onCreated, initialProductId }: NewOrderDialogProps) {
  const create = useCreateOrder()
  const coverage = useCoverageZones()
  const products = useProducts(false)
  const [step, setStep] = useState<Step>('form')
  const [place, setPlace] = useState<Place | null>(null)
  const [address, setAddress] = useState('')
  const [autoAddress, setAutoAddress] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [windowStart, setWindowStart] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderLine[]>(() =>
    initialProductId ? [{ productId: initialProductId, quantity: 1 }] : []
  )
  const [contact, setContact] = useState<OrderContactValues>({ addressReference: '', postalCode: '', contactPhone: '' })
  const [errors, setErrors] = useState<OrderErrors>({})

  const windowEnd = deliveryWindows.find((w) => w.start === windowStart)?.end ?? ''
  const zones = coverage.data ?? []
  const location = place === null ? null : { latitude: place.latitude, longitude: place.longitude }
  const covering = location === null ? null : zoneCovering(location, zones)

  const onPlace = (next: Place | null) => {
    setPlace(next)
    // Keep the typed address unless it is empty or still the one filled from the map.
    const suggested = next?.address || next?.name || ''
    if (address === '' || address === autoAddress) setAddress(suggested)
    setAutoAddress(suggested)
  }

  const fields = { address: address.trim(), deliveryDate, windowStart, windowEnd }

  const goToConfirm = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validateNewOrder({ ...fields, location, items, ...contact }, localToday())
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setStep('confirm')
  }

  const confirm = () => {
    create.mutate(
      {
        ...fields,
        items,
        addressReference: contact.addressReference.trim(),
        ...(contact.postalCode.trim() === '' ? {} : { postalCode: contact.postalCode.trim() }),
        contactPhone: normalizePhone(contact.contactPhone.trim()),
        ...(location ?? {}),
        ...(notes.trim() === '' ? {} : { notes: notes.trim() }),
      },
      { onSuccess: onCreated },
    )
  }

  const windowError = errors.windowStart ?? errors.windowEnd ? 'Elige una ventana de entrega.' : undefined

  if (step === 'confirm') {
    const lines = items.map((line) => {
      const product = (products.data ?? []).find((p) => p.id === line.productId)
      return { ...line, name: product?.name ?? 'Producto', cents: Math.round(Number(product?.unitPrice ?? '0') * 100) }
    })
    const total = lines.reduce((sum, line) => sum + line.cents * line.quantity, 0)
    const windowLabel = deliveryWindows.find((w) => w.start === windowStart)?.label ?? ''
    return (
      <Modal title="Confirma tu pedido" titleId="new-order-title" eyebrow="Revisa los datos" onClose={onClose} wide>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-on-surface-variant">Revisa que todo esté bien. Al confirmar enviaremos el pedido.</p>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl bg-surface-container-low p-4 text-sm sm:grid-cols-2">
            <Item label="Dirección" value={fields.address} />
            <Item label="Referencia" value={contact.addressReference.trim()} />
            <Item label="Código postal" value={contact.postalCode.trim() === '' ? 'No indicado' : contact.postalCode.trim()} />
            <Item label="Teléfono de contacto" value={normalizePhone(contact.contactPhone.trim())} />
            <Item label="Fecha de entrega" value={deliveryDate} />
            <Item label="Ventana" value={windowLabel} />
          </dl>

          <ul aria-label="Productos del pedido" className="flex flex-col gap-1 rounded-2xl border border-surface-container-high p-3 text-sm">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center justify-between gap-3">
                <span>{`${String(line.quantity)} × ${line.name}`}</span>
                <span className="font-mono font-semibold">${((line.cents * line.quantity) / 100).toFixed(2)}</span>
              </li>
            ))}
            <li className="mt-1 flex items-center justify-between border-t border-surface-container-high pt-2 font-bold text-primary">
              <span>Total estimado</span>
              <span className="font-mono">${(total / 100).toFixed(2)}</span>
            </li>
          </ul>

          <CoverageNotice zones={zones} loading={coverage.isPending} failed={coverage.isError} located={location !== null} zone={covering} />

          {create.isError ? (
            <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
              No se pudo crear el pedido. {userMessage(create.error)}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={create.isPending} className={secondaryButton} onClick={() => { setStep('form') }}>
              Editar datos
            </button>
            <button type="button" disabled={create.isPending} className={primaryButton} onClick={confirm}>
              {create.isPending ? 'Enviando…' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Hacer nuevo pedido" titleId="new-order-title" eyebrow="Catálogo & Pedir" onClose={onClose} wide>
      <form noValidate className="flex flex-col gap-4" onSubmit={goToConfirm}>
        <OrderItemsPicker value={items} onChange={setItems} error={errors.items} />

        <div className="flex flex-col gap-1">
          <span className={fieldLabelClass}>Punto en el mapa (opcional)</span>
          <p className="text-[11px] text-on-surface-variant">
            Las zonas en verde son las que cubrimos: si tu punto cae dentro, tu pedido no será rechazado por la zona.
          </p>
          <AddressPicker value={place} onChange={onPlace} zones={zones} expandable />
          {errors.location ? <ErrorMessage>{errors.location}</ErrorMessage> : null}
          <CoverageNotice zones={zones} loading={coverage.isPending} failed={coverage.isError} located={location !== null} zone={covering} />
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
          <p className="text-[10px] text-on-surface-variant">
            Se llena al hacer clic en el mapa; puedes corregirla o completarla.
          </p>
          {errors.address ? <ErrorMessage>{errors.address}</ErrorMessage> : null}
        </div>

        <OrderContactFields
          idPrefix="new-order"
          values={contact}
          errors={errors}
          onChange={(key, value) => { setContact((current) => ({ ...current, [key]: value })) }}
        />

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

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={primaryButton}>
            Revisar pedido
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd className="break-words font-semibold text-on-surface">{value}</dd>
    </div>
  )
}

interface CoverageNoticeProps {
  zones: readonly CoverageZone[]
  loading: boolean
  failed: boolean
  located: boolean
  zone: CoverageZone | null
}

/** Dice si el punto elegido está dentro de la cobertura, para que el cliente sepa cómo seguirá su pedido. */
function CoverageNotice({ zones, loading, failed, located, zone }: CoverageNoticeProps) {
  if (loading) return <p role="status" className="text-[11px] text-on-surface-variant">Cargando zonas de cobertura…</p>
  if (failed || zones.length === 0) {
    return <p role="status" className="text-[11px] text-on-surface-variant">No pudimos mostrar las zonas de cobertura. Un operador validará tu dirección.</p>
  }
  if (!located) {
    return <p role="status" className="text-[11px] text-on-surface-variant">Marca tu punto en el mapa para saber si está dentro de la cobertura.</p>
  }
  if (zone !== null) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
        {`Dentro de la zona «${zone.name}»: tu pedido no será rechazado por la zona.`}
      </p>
    )
  }
  return (
    <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
      Fuera de la cobertura: tu pedido quedará en revisión y un operador podría rechazarlo por la zona. Mueve el punto a una zona verde.
    </p>
  )
}
