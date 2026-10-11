import { describe, expect, it } from 'vitest'
import { codePreview, codePrefixFromName } from './code'

// Mismos ejemplos que TestCodePrefixFromName en Zone Service (domain/code_test.go).
describe('codePrefixFromName', () => {
  it.each([
    ['Zona Norte', 'NORTE'],
    ['Norte', 'NORTE'],
    ['Zona', 'ZONA'],
    ['  zona  sector  ', 'ZONA'],
    ['Centro Histórico', 'CENTRO'],
    ['Ñuñoa', 'NUNOA'],
    ['Carcelén', 'CARCEL'],
    ['Valle de los Chillos', 'VALLE'],
    ['Sur 2', 'SUR'],
    ['123', 'ZONA'],
    ['', 'ZONA'],
  ])('%j -> %s', (name, prefix) => {
    expect(codePrefixFromName(name)).toBe(prefix)
  })
})

describe('codePreview', () => {
  it('muestra el prefijo con el número aún pendiente', () => {
    expect(codePreview('Zona Norte')).toBe('NORTE-###')
  })

  it('usa el prefijo de respaldo mientras el nombre está vacío', () => {
    expect(codePreview('')).toBe('ZONA-###')
  })
})
