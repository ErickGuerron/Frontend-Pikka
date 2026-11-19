import { ErrorMessage, fieldLabelClass, inputClass } from '@/shared/ui/form'
import { POSTAL_MAX, REFERENCE_MAX, sanitizePhoneInput } from '@/shared/validation/contact'
import type { OrderErrors } from './validation'

export interface OrderContactValues {
  addressReference: string
  postalCode: string
  contactPhone: string
}

export interface OrderContactFieldsProps {
  /** Prefijo de los ids del DOM, para que dos formularios no colisionen. */
  idPrefix: string
  values: OrderContactValues
  errors: OrderErrors
  disabled?: boolean
  onChange: (key: keyof OrderContactValues, value: string) => void
}

const help = 'text-[10px] text-on-surface-variant'

/** Referencia del lugar (obligatoria), código postal (opcional) y teléfono de contacto (obligatorio). */
export function OrderContactFields({ idPrefix, values, errors, disabled = false, onChange }: OrderContactFieldsProps) {
  const id = (name: string) => `${idPrefix}-${name}`
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className={fieldLabelClass} htmlFor={id('reference')}>
          Referencia del lugar *
        </label>
        <input
          id={id('reference')}
          className={inputClass}
          disabled={disabled}
          maxLength={REFERENCE_MAX}
          placeholder="Ej. Casa azul de dos pisos, junto a la farmacia"
          aria-invalid={errors.addressReference ? true : undefined}
          aria-describedby={errors.addressReference ? id('reference-error') : id('reference-help')}
          value={values.addressReference}
          onChange={(e) => { onChange('addressReference', e.target.value) }}
        />
        {errors.addressReference ? (
          <ErrorMessage id={id('reference-error')}>{errors.addressReference}</ErrorMessage>
        ) : (
          <p id={id('reference-help')} className={help}>Ayuda al repartidor a encontrar el lugar.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className={fieldLabelClass} htmlFor={id('phone')}>
          Teléfono de contacto *
        </label>
        <input
          id={id('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={inputClass}
          disabled={disabled}
          maxLength={20}
          placeholder="0991234567"
          aria-invalid={errors.contactPhone ? true : undefined}
          aria-describedby={errors.contactPhone ? id('phone-error') : undefined}
          value={values.contactPhone}
          onChange={(e) => { onChange('contactPhone', sanitizePhoneInput(e.target.value)) }}
        />
        {errors.contactPhone ? <ErrorMessage id={id('phone-error')}>{errors.contactPhone}</ErrorMessage> : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className={fieldLabelClass} htmlFor={id('postal')}>
          Código postal (opcional)
        </label>
        <input
          id={id('postal')}
          className={inputClass}
          disabled={disabled}
          maxLength={POSTAL_MAX}
          placeholder="170150"
          aria-invalid={errors.postalCode ? true : undefined}
          aria-describedby={errors.postalCode ? id('postal-error') : undefined}
          value={values.postalCode}
          onChange={(e) => { onChange('postalCode', e.target.value) }}
        />
        {errors.postalCode ? <ErrorMessage id={id('postal-error')}>{errors.postalCode}</ErrorMessage> : null}
      </div>
    </div>
  )
}
