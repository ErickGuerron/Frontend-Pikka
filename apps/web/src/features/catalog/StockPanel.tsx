import { useState, type SyntheticEvent } from 'react'
import { ApiError, userMessage } from '@/shared/api/errors'
import { ErrorMessage, Field, fieldLabelClass, inputClass } from '@/shared/ui/form'
import { useAdjustStock, useStockMovements } from './hooks'
import {
  movementLabels,
  stockAdjustmentLabels,
  stockAdjustmentTypes,
  type Product,
  type StockAdjustmentType,
} from './types'
import { toAdjustment, validateAdjustment, type AdjustmentErrors, type AdjustmentForm } from './validation'

const emptyForm: AdjustmentForm = { type: 'RESTOCK', delta: '', reason: '' }

/** Ajuste de stock de un producto y su historial, del más reciente al más antiguo. */
export function StockPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  const [form, setForm] = useState<AdjustmentForm>(emptyForm)
  const [errors, setErrors] = useState<AdjustmentErrors>({})
  const adjust = useAdjustStock()
  const history = useStockMovements(product.id)

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    const found = validateAdjustment(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    adjust.mutate(
      { id: product.id, input: toAdjustment(form) },
      { onSuccess: () => { setForm((current) => ({ ...current, delta: '', reason: '' })) } },
    )
  }

  return (
    <section aria-labelledby="stock-panel-title" className="flex flex-col gap-6 rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="stock-panel-title" className="text-lg font-bold text-on-surface">Stock de {product.name}</h2>
        <button type="button" className="cursor-pointer text-sm font-semibold text-on-surface-variant" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <form noValidate className="grid gap-4 sm:grid-cols-3" onSubmit={submit}>
        {/* Label aparte: envolver el select haría que el nombre accesible incluya las opciones. */}
        <div className="flex flex-col gap-1">
          <label htmlFor="stock-type" className={fieldLabelClass}>Tipo de movimiento</label>
          <select
            id="stock-type"
            className={inputClass}
            value={form.type}
            onChange={(event) => { setForm((current) => ({ ...current, type: event.target.value as StockAdjustmentType })) }}
          >
            {stockAdjustmentTypes.map((type) => (
              <option key={type} value={type}>{stockAdjustmentLabels[type]}</option>
            ))}
          </select>
        </div>

        <Field label="Cantidad (+ suma, - resta)">
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.delta}
            aria-invalid={errors.delta !== undefined}
            aria-describedby={errors.delta === undefined ? undefined : 'stock-delta-error'}
            onChange={(event) => { setForm((current) => ({ ...current, delta: event.target.value })) }}
          />
        </Field>

        <Field label={form.type === 'ADJUSTMENT' ? 'Motivo (obligatorio)' : 'Motivo (opcional)'}>
          <input
            className={inputClass}
            value={form.reason}
            maxLength={300}
            aria-invalid={errors.reason !== undefined}
            aria-describedby={errors.reason === undefined ? undefined : 'stock-reason-error'}
            onChange={(event) => { setForm((current) => ({ ...current, reason: event.target.value })) }}
          />
        </Field>

        {errors.delta === undefined ? null : <ErrorMessage id="stock-delta-error">{errors.delta}</ErrorMessage>}
        {errors.reason === undefined ? null : <ErrorMessage id="stock-reason-error">{errors.reason}</ErrorMessage>}
        {adjust.isError ? <ErrorMessage>{stockErrorMessage(adjust.error)}</ErrorMessage> : null}

        <div className="flex justify-end sm:col-span-3">
          <button
            type="submit"
            disabled={adjust.isPending}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Registrar movimiento
          </button>
        </div>
      </form>

      {history.isPending ? (
        <p role="status" className="text-sm text-on-surface-variant">Cargando historial…</p>
      ) : history.isError ? (
        <ErrorMessage>{userMessage(history.error)}</ErrorMessage>
      ) : (
        <div className="overflow-x-auto">
          <table aria-label={`Movimientos de ${product.name}`} className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th scope="col" className="px-3 py-2">Fecha</th>
                <th scope="col" className="px-3 py-2">Tipo</th>
                <th scope="col" className="px-3 py-2">Cantidad</th>
                <th scope="col" className="px-3 py-2">Stock resultante</th>
                <th scope="col" className="px-3 py-2">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {history.data.map((movement) => (
                <tr key={movement.id} className="border-t border-surface-container-high/60">
                  <td className="px-3 py-2">{new Date(movement.createdAt).toLocaleString('es-MX')}</td>
                  <td className="px-3 py-2">{movementLabels[movement.type]}</td>
                  <td className="px-3 py-2">{movement.delta > 0 ? `+${String(movement.delta)}` : String(movement.delta)}</td>
                  <td className="px-3 py-2">{movement.resultingStock}</td>
                  <td className="px-3 py-2">{movement.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.data.length === 0 ? <p className="p-4 text-center text-sm text-on-surface-variant">Sin movimientos todavía.</p> : null}
        </div>
      )}
    </section>
  )
}

/** El backend rechaza con 422 un ajuste que dejaría el stock en negativo. */
function stockErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 422) return 'El ajuste dejaría el stock en negativo. Revisa la cantidad.'
  return userMessage(error)
}
