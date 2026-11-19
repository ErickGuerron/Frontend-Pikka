import { useRef, useState, type SyntheticEvent } from 'react'
import { ApiError, userMessage } from '@/shared/api/errors'
import { useDialog } from '@/shared/ui/dialog'
import { ErrorMessage, Field, fieldLabelClass, inputClass } from '@/shared/ui/form'
import { Pagination, usePagination } from '@/shared/ui/pagination'
import { useAdjustStock, useStockMovements } from './hooks'
import {
  movementLabels,
  stockAdjustmentLabels,
  stockAdjustmentTypes,
  type Product,
  type StockAdjustmentType,
} from './types'
import {
  STOCK_MAX_DIGITS,
  sanitizeDelta,
  toAdjustment,
  validateAdjustment,
  type AdjustmentErrors,
  type AdjustmentForm,
} from './validation'

const emptyForm: AdjustmentForm = { type: 'RESTOCK', delta: '', reason: '' }

/** Ajuste de stock de un producto y su historial en un diálogo accesible: foco inicial, Escape, foco atrapado y retorno al disparador. */
export function StockPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  const [form, setForm] = useState<AdjustmentForm>(emptyForm)
  const [errors, setErrors] = useState<AdjustmentErrors>({})
  const adjust = useAdjustStock()
  const history = useStockMovements(product.id)
  const pager = usePagination(history.data ?? [])
  const dialogRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLSelectElement>(null)

  useDialog(dialogRef, typeRef, onClose, adjust.isPending)

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#002628]/60 backdrop-blur-xs sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-panel-title"
        className="flex max-h-[92vh] w-full flex-col gap-5 overflow-y-auto rounded-t-2xl border border-[#cce7ea] bg-white p-6 shadow-2xl sm:max-w-3xl sm:rounded-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#cce7ea] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#004b4e]" aria-hidden="true">
              inventory
            </span>
            <h2 id="stock-panel-title" className="text-lg font-bold text-[#004b4e] font-sans">
              Stock de {product.name}
            </h2>
          </div>
          <button
            type="button"
            className="cursor-pointer font-mono text-xs uppercase tracking-wider font-semibold text-[#557b7f] hover:text-[#004b4e] transition-colors"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <form noValidate className="grid gap-3.5 sm:grid-cols-3" onSubmit={submit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="stock-type" className={fieldLabelClass}>Tipo de movimiento</label>
            <select
              ref={typeRef}
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
              maxLength={STOCK_MAX_DIGITS + 1}
              value={form.delta}
              aria-invalid={errors.delta !== undefined}
              aria-describedby={errors.delta === undefined ? undefined : 'stock-delta-error'}
              onChange={(event) => { setForm((current) => ({ ...current, delta: sanitizeDelta(event.target.value) })) }}
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
          {adjust.isError ? (
            <div className="sm:col-span-3 p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] font-mono text-xs">
              {stockErrorMessage(adjust.error)}
            </div>
          ) : null}

          <div className="flex justify-end sm:col-span-3 pt-2">
            <button
              type="submit"
              disabled={adjust.isPending}
              className="cursor-pointer rounded-lg bg-[#004b4e] hover:bg-[#0a6568] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white border border-[#004b4e] disabled:opacity-50 transition-colors shadow-sm"
            >
              Registrar movimiento
            </button>
          </div>
        </form>

        {history.isPending ? (
          <div role="status" className="p-8 text-center font-mono text-xs text-[#557b7f]">
            Cargando historial…
          </div>
        ) : history.isError ? (
          <div className="p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] font-mono text-xs">
            {userMessage(history.error)}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#cce7ea]">
            <table aria-label={`Movimientos de ${product.name}`} className="w-full text-left text-xs">
              <thead className="bg-[#f0fafb] text-[#557b7f] font-mono uppercase tracking-wider text-[10px] border-b border-[#cce7ea]">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-bold">Fecha</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Tipo</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Cantidad</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Stock resultante</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cce7ea]">
                {pager.pageItems.map((movement) => (
                  <tr key={movement.id} className="hover:bg-[#f7fcfc] transition-colors">
                    <td className="px-3 py-2.5 font-mono text-[#557b7f]">{new Date(movement.createdAt).toLocaleString('es-MX')}</td>
                    <td className="px-3 py-2.5 font-medium text-[#061f23]">{movementLabels[movement.type]}</td>
                    <td className="px-3 py-2.5 font-mono font-bold">
                      <span className={movement.delta > 0 ? 'text-[#006b5f]' : 'text-[#ba1a1a]'}>
                        {movement.delta > 0 ? `+${String(movement.delta)}` : String(movement.delta)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[#061f23]">{movement.resultingStock}</td>
                    <td className="px-3 py-2.5 text-[#557b7f]">{movement.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.data.length === 0 ? (
              <p className="p-6 text-center font-mono text-xs text-[#557b7f]">Sin movimientos todavía.</p>
            ) : null}
            <Pagination label="movimientos" {...pager} onPage={pager.setPage} />
          </div>
        )}
      </div>
    </div>
  )
}

/** El backend rechaza con 422 un ajuste que dejaría el stock en negativo. */
function stockErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 422) return 'El ajuste dejaría el stock en negativo. Revisa la cantidad.'
  return userMessage(error)
}
