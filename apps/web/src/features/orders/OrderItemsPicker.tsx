import { useProducts } from '@/features/catalog/hooks'
import type { Product } from '@/features/catalog/types'
import { userMessage } from '@/shared/api/errors'
import { ErrorMessage, fieldLabelClass } from '@/shared/ui/form'
import { placeholderColor } from '@/shared/ui/product-color'
import { MAX_LINE_QUANTITY, type OrderLine } from './types'

interface OrderItemsPickerProps {
  value: OrderLine[]
  onChange: (lines: OrderLine[]) => void
  error?: string | undefined
  disabled?: boolean
}

const stepButton =
  'flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary transition-colors hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-container disabled:hover:text-primary cursor-pointer'

/** Precio en centavos enteros: evita errores de coma flotante al sumar. */
function cents(unitPrice: string): number {
  return Math.round(Number(unitPrice) * 100)
}

function formatCents(total: number): string {
  return `$${(total / 100).toFixed(2)}`
}

/** Cantidad máxima de una línea: el tope del contrato o el stock disponible si el producto lo controla. */
function maxQuantity(product: Product): number {
  return product.stockQuantity === undefined ? MAX_LINE_QUANTITY : Math.min(MAX_LINE_QUANTITY, product.stockQuantity)
}

/** Catálogo activo con selector de cantidad por producto. Devuelve solo las líneas con cantidad > 0. */
export function OrderItemsPicker({ value, onChange, error, disabled = false }: OrderItemsPickerProps) {
  const products = useProducts(false)
  const quantityOf = (id: string) => value.find((line) => line.productId === id)?.quantity ?? 0

  const setQuantity = (id: string, quantity: number) => {
    const rest = value.filter((line) => line.productId !== id)
    onChange(quantity > 0 ? [...rest, { productId: id, quantity }] : rest)
  }

  const catalog = (products.data ?? []).filter((product) => product.active)
  const total = value.reduce((sum, line) => {
    const product = catalog.find((p) => p.id === line.productId)
    return product === undefined ? sum : sum + cents(product.unitPrice) * line.quantity
  }, 0)
  const units = value.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error === undefined ? undefined : 'order-items-error'}>
      <legend className={fieldLabelClass}>Productos *</legend>

      {products.isPending ? (
        <p role="status" className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
          Cargando productos…
        </p>
      ) : products.isError ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
          <span>No pudimos cargar los productos. {userMessage(products.error)}</span>
          <button type="button" className="cursor-pointer font-semibold underline" onClick={() => void products.refetch()}>
            Reintentar
          </button>
        </div>
      ) : catalog.length === 0 ? (
        <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
          Aún no hay productos disponibles para pedir.
        </p>
      ) : (
        <ul className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {catalog.map((product) => {
            const quantity = quantityOf(product.id)
            const max = maxQuantity(product)
            const soldOut = max === 0
            return (
              <li
                key={product.id}
                className={`flex items-center gap-3 rounded-2xl border bg-surface-container-lowest p-3 shadow-sm transition-colors ${
                  quantity > 0 ? 'border-secondary' : 'border-surface-container-high'
                } ${soldOut ? 'opacity-60' : ''}`}
              >
                <div
                  aria-hidden="true"
                  style={{ backgroundColor: placeholderColor(product.id) }}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-primary/70"
                >
                  {product.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">{product.name}</p>
                  <p className="font-mono text-xs font-bold text-primary">${product.unitPrice}</p>
                  {soldOut ? <p className="text-[11px] font-semibold text-error">Agotado</p> : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Quitar una unidad de ${product.name}`}
                    disabled={disabled || quantity === 0}
                    className={stepButton}
                    onClick={() => { setQuantity(product.id, quantity - 1) }}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-base">remove</span>
                  </button>
                  <span aria-label={`Cantidad de ${product.name}`} className="w-6 text-center font-mono text-sm font-bold tabular-nums text-on-surface">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Agregar una unidad de ${product.name}`}
                    disabled={disabled || quantity >= max}
                    className={stepButton}
                    onClick={() => { setQuantity(product.id, quantity + 1) }}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-base">add</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-2.5 text-sm">
        <span className="text-on-surface-variant">
          {units === 0 ? 'Sin productos elegidos' : `${String(units)} ${units === 1 ? 'unidad' : 'unidades'}`}
        </span>
        <span className="font-mono font-bold text-primary">Total estimado {formatCents(total)}</span>
      </div>
      {error === undefined ? null : <ErrorMessage id="order-items-error">{error}</ErrorMessage>}
    </fieldset>
  )
}
