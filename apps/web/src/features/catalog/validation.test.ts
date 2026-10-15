import { describe, expect, it } from 'vitest'
import { toAdjustment, toNewProduct, validateAdjustment, validateNewProduct } from './validation'

const validProduct = { name: 'Agua 1L', description: '', unitPrice: '2.50', initialStock: '' }

describe('alta de producto', () => {
  it('acepta un producto válido sin control de stock', () => {
    expect(validateNewProduct(validProduct)).toEqual({})
  })

  it('pide nombre y lo limita a 120 caracteres', () => {
    expect(validateNewProduct({ ...validProduct, name: '   ' })).toHaveProperty('name')
    expect(validateNewProduct({ ...validProduct, name: 'a'.repeat(121) })).toHaveProperty('name')
  })

  it.each(['', 'abc', '2.505', '-1', '1,50'])('rechaza el precio %j', (unitPrice) => {
    expect(validateNewProduct({ ...validProduct, unitPrice })).toHaveProperty('unitPrice')
  })

  it.each(['2', '2.5', '2.50', '0'])('acepta el precio %j', (unitPrice) => {
    expect(validateNewProduct({ ...validProduct, unitPrice })).not.toHaveProperty('unitPrice')
  })

  it.each(['-1', '1.5', 'diez'])('rechaza el stock inicial %j', (initialStock) => {
    expect(validateNewProduct({ ...validProduct, initialStock })).toHaveProperty('initialStock')
  })

  it('convierte el formulario al cuerpo del contrato, omitiendo los campos vacíos', () => {
    expect(toNewProduct({ ...validProduct, description: ' ' })).toEqual({ name: 'Agua 1L', unitPrice: '2.50' })
    expect(toNewProduct({ ...validProduct, description: 'Botella', initialStock: '12' })).toEqual({
      name: 'Agua 1L',
      description: 'Botella',
      unitPrice: '2.50',
      initialStock: 12,
    })
  })
})

describe('ajuste de stock', () => {
  it('la entrada exige un número positivo', () => {
    expect(validateAdjustment({ type: 'RESTOCK', delta: '5', reason: '' })).toEqual({})
    expect(validateAdjustment({ type: 'RESTOCK', delta: '-3', reason: '' })).toHaveProperty('delta')
    expect(validateAdjustment({ type: 'RESTOCK', delta: '0', reason: '' })).toHaveProperty('delta')
  })

  it('el ajuste manual exige motivo y un delta distinto de cero, positivo o negativo', () => {
    expect(validateAdjustment({ type: 'ADJUSTMENT', delta: '-2', reason: 'Merma' })).toEqual({})
    expect(validateAdjustment({ type: 'ADJUSTMENT', delta: '-2', reason: '  ' })).toHaveProperty('reason')
    expect(validateAdjustment({ type: 'ADJUSTMENT', delta: '0', reason: 'Conteo' })).toHaveProperty('delta')
  })

  it('rechaza deltas que no son enteros', () => {
    expect(validateAdjustment({ type: 'RESTOCK', delta: '1.5', reason: '' })).toHaveProperty('delta')
  })

  it('convierte a la forma del contrato y omite el motivo en la entrada', () => {
    expect(toAdjustment({ type: 'RESTOCK', delta: '4', reason: 'compra' })).toEqual({ type: 'RESTOCK', delta: 4 })
    expect(toAdjustment({ type: 'ADJUSTMENT', delta: '-1', reason: ' Rotura ' })).toEqual({
      type: 'ADJUSTMENT',
      delta: -1,
      reason: 'Rotura',
    })
  })
})
