import { describe, expect, it } from 'vitest'
import { ApiError, userMessage } from './errors'

describe('userMessage', () => {
  it('un error del servidor sin traducción muestra una referencia para buscarlo en los logs', () => {
    const error = new ApiError(500, 'INTERNAL', 'internal error', '9a814033-ce2d-4838-b5ee-23eb9170c1fe')
    expect(userMessage(error)).toBe('Ocurrió un error inesperado (referencia 9a814033).')
  })

  it('sin requestId conserva el mensaje genérico', () => {
    expect(userMessage(new ApiError(500, 'INTERNAL', 'internal error'))).toBe('Ocurrió un error inesperado.')
    expect(userMessage(new ApiError(500, 'INTERNAL', 'internal error', '   '))).toBe('Ocurrió un error inesperado.')
  })

  it('un código conocido usa su mensaje aunque traiga requestId', () => {
    expect(userMessage(new ApiError(403, 'FORBIDDEN', 'forbidden', 'abc'))).toBe('No tienes permiso para esta acción.')
  })

  it('un error que no viene de la API sigue siendo genérico', () => {
    expect(userMessage(new Error('boom'))).toBe('Ocurrió un error inesperado.')
  })
})
