import type { StockAdjustmentType } from './types'

/** Formularios en texto tal como los escribe la persona; se validan antes de llamar a la API. */
export interface NewProductForm {
  name: string
  description: string
  unitPrice: string
  initialStock: string
}

export const NAME_MAX = 100
export const DESCRIPTION_MAX = 200
export const STOCK_MAX_DIGITS = 6

export interface NewProductErrors {
  name?: string
  description?: string
  unitPrice?: string
  initialStock?: string
}

export interface AdjustmentForm {
  type: StockAdjustmentType
  delta: string
  reason: string
}

export interface AdjustmentErrors {
  delta?: string
  reason?: string
}

/** Contrato: texto decimal con como máximo dos decimales, por ejemplo "2.50". */
const pricePattern = /^\d+(\.\d{1,2})?$/
const wholeNumberPattern = /^\d+$/
const signedWholeNumberPattern = /^[+-]?\d+$/

export function validateNewProduct(form: NewProductForm): NewProductErrors {
  const errors: NewProductErrors = {}
  const name = form.name.trim()
  if (name === '') errors.name = 'Escribe el nombre del producto.'
  else if (name.length > NAME_MAX) errors.name = `El nombre no puede pasar de ${String(NAME_MAX)} caracteres.`

  if (form.description.trim().length > DESCRIPTION_MAX) {
    errors.description = `La descripción no puede pasar de ${String(DESCRIPTION_MAX)} caracteres.`
  }

  if (!pricePattern.test(form.unitPrice.trim())) {
    errors.unitPrice = 'Indica el precio en dólares, con hasta dos decimales. Por ejemplo, 2.50.'
  }

  const stock = form.initialStock.trim()
  if (stock !== '' && (!wholeNumberPattern.test(stock) || stock.length > STOCK_MAX_DIGITS)) {
    errors.initialStock = `El stock inicial debe ser un número entero de hasta ${String(STOCK_MAX_DIGITS)} cifras, sin letras ni signos.`
  }
  return errors
}

/** Sin stock inicial el producto no controla inventario (el campo queda vacío). */
export function toNewProduct(form: NewProductForm) {
  const description = form.description.trim()
  const stock = form.initialStock.trim()
  return {
    name: form.name.trim(),
    ...(description === '' ? {} : { description }),
    unitPrice: form.unitPrice.trim(),
    ...(stock === '' ? {} : { initialStock: Number(stock) }),
  }
}

/** Deja un signo opcional al inicio y hasta 6 dígitos; descarta letras y cualquier otro símbolo. */
export function sanitizeDelta(value: string): string {
  const sign = /^\s*([+-])/.exec(value)?.[1] ?? ''
  return sign + value.replace(/\D/g, '').slice(0, STOCK_MAX_DIGITS)
}

export function validateAdjustment(form: AdjustmentForm): AdjustmentErrors {
  const errors: AdjustmentErrors = {}
  const delta = form.delta.trim()
  if (!signedWholeNumberPattern.test(delta) || Number(delta) === 0 || delta.replace(/\D/g, '').length > STOCK_MAX_DIGITS) {
    errors.delta = `Indica una cantidad entera distinta de cero, de hasta ${String(STOCK_MAX_DIGITS)} cifras.`
  } else if (form.type === 'RESTOCK' && Number(delta) < 0) {
    errors.delta = 'Una entrada suma stock: usa una cantidad positiva.'
  }
  if (form.type === 'ADJUSTMENT' && form.reason.trim() === '') {
    errors.reason = 'Indica el motivo del ajuste.'
  }
  return errors
}

export function toAdjustment(form: AdjustmentForm) {
  const reason = form.reason.trim()
  return {
    type: form.type,
    delta: Number(form.delta.trim()),
    ...(form.type === 'ADJUSTMENT' ? { reason } : {}),
  }
}
