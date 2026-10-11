import { ErrorMessage, fieldLabelClass, inputClass } from '@/shared/ui/form'
import { localToday, type OrderErrors, type OrderFields } from './validation'

const subLabelClass = 'text-[10px] text-on-surface-variant'

export interface OrderDetailsFieldsProps {
  /** Prefijo de los ids del DOM, para que dos formularios no colisionen. */
  idPrefix: string
  values: OrderFields
  errors: OrderErrors
  disabled?: boolean
  onChange: (key: keyof OrderFields, value: string) => void
}

/**
 * Dirección de texto, fecha y ventana de entrega. Lo usan el registro de pedidos
 * y el panel de corrección de la cola de excepciones.
 */
export function OrderDetailsFields({ idPrefix, values, errors, disabled = false, onChange }: OrderDetailsFieldsProps) {
  const id = (name: string) => `${idPrefix}-${name}`
  const errorId = (name: string) => `${idPrefix}-${name}-error`

  return (
    <>
      <div className="lg:col-span-2 flex flex-col gap-1">
        <label className={fieldLabelClass} htmlFor={id('address')}>
          Dirección de entrega *
        </label>
        <input
          id={id('address')}
          aria-describedby={errors.address ? errorId('address') : id('address-help')}
          aria-invalid={errors.address ? true : undefined}
          className={inputClass}
          disabled={disabled}
          onChange={(e) => { onChange('address', e.target.value); }}
          placeholder="Calle, número, colonia y referencia"
          type="text"
          value={values.address}
        />
        {errors.address ? (
          <ErrorMessage id={errorId('address')}>{errors.address}</ErrorMessage>
        ) : (
          <p id={id('address-help')} className={subLabelClass}>Incluye referencias para el repartidor.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className={fieldLabelClass} htmlFor={id('date')}>
          Fecha de entrega *
        </label>
        <input
          id={id('date')}
          aria-describedby={errors.deliveryDate ? errorId('date') : undefined}
          aria-invalid={errors.deliveryDate ? true : undefined}
          className={inputClass}
          disabled={disabled}
          min={localToday()}
          onChange={(e) => { onChange('deliveryDate', e.target.value); }}
          type="date"
          value={values.deliveryDate}
        />
        {errors.deliveryDate ? <ErrorMessage id={errorId('date')}>{errors.deliveryDate}</ErrorMessage> : null}
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className={fieldLabelClass}>Ventana aproximada *</legend>
        <div className="grid grid-cols-2 gap-2">
          <TimeField
            id={id('window-start')}
            label="Desde"
            error={errors.windowStart}
            errorId={errorId('window-start')}
            disabled={disabled}
            value={values.windowStart}
            onChange={(value) => { onChange('windowStart', value); }}
          />
          <TimeField
            id={id('window-end')}
            label="Hasta"
            error={errors.windowEnd}
            errorId={errorId('window-end')}
            disabled={disabled}
            value={values.windowEnd}
            onChange={(value) => { onChange('windowEnd', value); }}
          />
        </div>
      </fieldset>
    </>
  )
}

interface TimeFieldProps {
  id: string
  label: string
  error: string | undefined
  errorId: string
  disabled: boolean
  value: string
  onChange: (value: string) => void
}

function TimeField({ id, label, error, errorId, disabled, value, onChange }: TimeFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className={subLabelClass} htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={inputClass}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.value); }}
        type="time"
        value={value}
      />
      {error ? <ErrorMessage id={errorId}>{error}</ErrorMessage> : null}
    </div>
  )
}

