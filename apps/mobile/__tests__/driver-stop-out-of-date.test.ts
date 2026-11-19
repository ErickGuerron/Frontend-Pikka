import { ApiError } from '../src/api/errors'
import { isStopOutOfDate, outOfDateMessage } from '../src/features/driver-route/hooks'

// Tras registrar una entrega la pantalla podía seguir en "En camino"; un segundo toque respondía 422
// ("stop must be IN_TRANSIT") y la app mostraba "Ocurrió un error inesperado" sin refrescar la ruta.
describe('parada desactualizada', () => {
  it('un 409 o 422 indica que la ruta debe recargarse', () => {
    expect(isStopOutOfDate(new ApiError(422, 'FAILED_PRECONDITION', 'stop must be IN_TRANSIT to record its result'))).toBe(true)
    expect(isStopOutOfDate(new ApiError(409, 'CONFLICT', 'conflict'))).toBe(true)
  })

  it('otros errores no recargan la ruta', () => {
    expect(isStopOutOfDate(new ApiError(500, 'INTERNAL', 'internal error'))).toBe(false)
    expect(isStopOutOfDate(new ApiError(400, 'INVALID_ARGUMENT', 'bad'))).toBe(false)
    expect(isStopOutOfDate(new Error('red'))).toBe(false)
  })

  it('un 422 explica que la parada ya había cambiado; un 409 solo refresca', () => {
    expect(outOfDateMessage(new ApiError(422, 'FAILED_PRECONDITION', 'x'), 'No pudimos registrar la entrega.')).toBe(
      'No pudimos registrar la entrega. La parada ya había cambiado de estado (quizá ya se registró). Actualizamos tu ruta.',
    )
    expect(outOfDateMessage(new ApiError(409, 'CONFLICT', 'x'), 'No pudimos registrar la entrega.')).toBeNull()
  })
})
