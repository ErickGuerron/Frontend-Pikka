import { describe, expect, it } from 'vitest'
import { DESCRIPTION_MAX, validateNewProduct, type NewProductForm } from './validation'

const valid: NewProductForm = { name: 'Agua 1L', description: '', unitPrice: '2.50', initialStock: '' }

describe('validateNewProduct: descripción', () => {
  it('acepta una descripción de exactamente el máximo permitido', () => {
    expect(validateNewProduct({ ...valid, description: 'x'.repeat(DESCRIPTION_MAX) }).description).toBeUndefined()
  })

  it('rechaza una descripción que pasa el máximo y lo indica con el límite', () => {
    const errors = validateNewProduct({ ...valid, description: 'x'.repeat(DESCRIPTION_MAX + 1) })
    expect(errors.description).toMatch(/200 caracteres/)
  })
})
