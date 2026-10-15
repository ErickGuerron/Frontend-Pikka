import type { StockAdjustmentType } from './types'

/** Formularios en texto tal como los escribe la persona; se validan antes de llamar a la API. */
export interface NewProductForm {
  name: string
  description: string
  unitPrice: string
  initialStock: string
}

export interface NewProductErrors {
  name?: string
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
  else if (name.length > 120) errors.name = 'El nombre no puede pasar de 120 caracteres.'

  if (!pricePattern.test(form.unitPrice.trim())) {
    errors.unitPrice = 'Indica el precio en dólares, con hasta dos decimales. Por ejemplo, 2.50.'
  }

  const stock = form.initialStock.trim()
  if (stock !== '' && !wholeNumberPattern.test(stock)) {
    errors.initialStock = 'El stock inicial debe ser un número entero, de 0 en adelante.'
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

export function validateAdjustment(form: AdjustmentForm): AdjustmentErrors {
  const errors: AdjustmentErrors = {}
  const delta = form.delta.trim()
  if (!signedWholeNumberPattern.test(delta) || Number(delta) === 0) {
    errors.delta = 'Indica una cantidad entera distinta de cero.'
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
