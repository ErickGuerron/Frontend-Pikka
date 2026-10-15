import { useState, type SyntheticEvent } from 'react'
import { ErrorMessage, Field, inputClass } from '@/shared/ui/form'
import { userMessage } from '@/shared/api/errors'
import { useCreateProduct } from './hooks'
import { toNewProduct, validateNewProduct, type NewProductErrors, type NewProductForm as Form } from './validation'

const empty: Form = { name: '', description: '', unitPrice: '', initialStock: '' }

export function ProductForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<NewProductErrors>({})
  const create = useCreateProduct()

  const set = (key: keyof Form) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    const found = validateNewProduct(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    create.mutate(toNewProduct(form), { onSuccess: onDone })
  }

  return (
    <form
      noValidate
      aria-labelledby="product-form-title"
      className="grid gap-4 rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm sm:grid-cols-2 sm:p-6"
      onSubmit={submit}
    >
      <h2 id="product-form-title" className="text-lg font-bold text-on-surface sm:col-span-2">Nuevo producto</h2>

      <Field label="Nombre">
        <input
          className={inputClass}
          value={form.name}
          maxLength={200}
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name === undefined ? undefined : 'product-name-error'}
          onChange={set('name')}
        />
      </Field>
      {errors.name === undefined ? null : <ErrorMessage id="product-name-error">{errors.name}</ErrorMessage>}

      <Field label="Descripción (opcional)">
        <input className={inputClass} value={form.description} maxLength={500} onChange={set('description')} />
      </Field>

      <Field label="Precio (USD)">
        <input
          className={inputClass}
          inputMode="decimal"
          value={form.unitPrice}
          aria-invalid={errors.unitPrice !== undefined}
          aria-describedby={errors.unitPrice === undefined ? undefined : 'product-price-error'}
          onChange={set('unitPrice')}
        />
      </Field>
      {errors.unitPrice === undefined ? null : <ErrorMessage id="product-price-error">{errors.unitPrice}</ErrorMessage>}

      <Field label="Stock inicial (opcional, vacío = sin control de stock)">
        <input
          className={inputClass}
          inputMode="numeric"
          value={form.initialStock}
          aria-invalid={errors.initialStock !== undefined}
          aria-describedby={errors.initialStock === undefined ? undefined : 'product-stock-error'}
          onChange={set('initialStock')}
        />
      </Field>
      {errors.initialStock === undefined ? null : <ErrorMessage id="product-stock-error">{errors.initialStock}</ErrorMessage>}

      {create.isError ? <ErrorMessage className="sm:col-span-2">{userMessage(create.error)}</ErrorMessage> : null}

      <div className="flex justify-end gap-3 sm:col-span-2">
        <button type="button" className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant" onClick={onDone}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={create.isPending}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Guardar producto
        </button>
      </div>
    </form>
  )
}
