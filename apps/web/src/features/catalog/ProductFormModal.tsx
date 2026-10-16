import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { ErrorMessage, Field, inputClass } from '@/shared/ui/form'
import { userMessage } from '@/shared/api/errors'
import { useCreateProduct } from './hooks'
import { toNewProduct, validateNewProduct, type NewProductErrors, type NewProductForm as Form } from './validation'

const empty: Form = { name: '', description: '', unitPrice: '', initialStock: '' }
const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'

interface ProductFormModalProps {
  onClose: () => void
  onCreated: (name: string) => void
}

/** Alta de producto en un diálogo accesible: foco inicial, Escape, foco atrapado y retorno al disparador. */
export function ProductFormModal({ onClose, onCreated }: ProductFormModalProps) {
  const [form, setForm] = useState<Form>(empty)
  const [tracksStock, setTracksStock] = useState(false)
  const [errors, setErrors] = useState<NewProductErrors>({})
  const create = useCreateProduct()
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const pending = create.isPending

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    nameRef.current?.focus()
    return () => { opener?.focus() }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose()
      if (event.key === 'Tab') trapFocus(event, dialogRef.current)
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose, pending])

  const set = (key: keyof Form) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    // Sin control de stock el campo no aplica: se valida y envía vacío.
    const payload: Form = { ...form, initialStock: tracksStock ? form.initialStock : '' }
    const found = validateNewProduct(payload)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const name = payload.name.trim()
    create.mutate(toNewProduct(payload), { onSuccess: () => { onCreated(name) } })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#002628]/60 backdrop-blur-xs sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl border border-[#cce7ea] sm:max-w-2xl sm:rounded-xl"
      >
        <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="sm:col-span-2 border-b border-[#cce7ea] pb-3 space-y-1">
            <div className="inline-flex items-center gap-2 rounded border border-[#cce7ea] bg-[#e8f7f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#004b4e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
              <span className="font-semibold">DOSSIER PRODUCTO · FICHA TÉCNICA</span>
            </div>
            <h2 id="product-form-title" className="text-lg font-bold text-[#004b4e] font-sans">
              Nuevo producto
            </h2>
          </div>

          <Field label="Nombre">
            <input
              ref={nameRef}
              className={inputClass}
              value={form.name}
              maxLength={120}
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

          <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#061f23] sm:col-span-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#004b4e]"
              checked={tracksStock}
              onChange={(event) => { setTracksStock(event.target.checked) }}
            />
            <span className="font-semibold">Controla stock</span>
          </label>

          {tracksStock ? (
            <>
              <Field label="Stock inicial">
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
            </>
          ) : null}

          {create.isError ? (
            <div className="sm:col-span-2 p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] font-mono text-xs">
              {userMessage(create.error)}
            </div>
          ) : null}

          <div className="flex justify-end gap-2.5 sm:col-span-2 pt-3 border-t border-[#cce7ea]">
            <button
              type="button"
              disabled={pending}
              className="cursor-pointer rounded-lg border border-[#cce7ea] bg-white hover:bg-[#e8f7f9] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#004b4e] disabled:opacity-50 transition-colors"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded-lg bg-[#004b4e] hover:bg-[#0a6568] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white border border-[#004b4e] disabled:opacity-50 transition-colors shadow-sm"
            >
              Guardar producto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Mantiene el Tab dentro del diálogo: del último control al primero y viceversa. */
function trapFocus(event: KeyboardEvent, dialog: HTMLElement | null) {
  if (dialog === null) return
  const items = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
  const first = items[0]
  const last = items.at(-1)
  if (first === undefined || last === undefined) return
  const active = document.activeElement
  const outside = active === null || !dialog.contains(active)
  if (event.shiftKey && (outside || active === first)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (outside || active === last)) {
    event.preventDefault()
    first.focus()
  }
}
