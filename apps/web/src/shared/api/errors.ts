/** Error con el formato único del API Gateway: {"error":{"code","message","requestId"}}. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string | undefined

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

const messages: Record<string, string> = {
  UNAUTHENTICATED: 'Correo o contraseña incorrectos.',
  FORBIDDEN: 'No tienes permiso para esta acción.',
  CONFLICT: 'Ya existe un registro con esos datos.',
  RATE_LIMITED: 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  UPSTREAM_UNAVAILABLE: 'No se pudo conectar con el backend. Revisa que el API Gateway esté corriendo.',
  UPSTREAM_TIMEOUT: 'El servicio tardó demasiado en responder.',
  NETWORK: 'No se pudo conectar con el servidor.',
}

/** Mensaje para mostrar al usuario a partir de cualquier error. */
export function userMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_ARGUMENT') return `Datos inválidos: ${error.message}.`
    return messages[error.code] ?? 'Ocurrió un error inesperado.'
  }
  return 'Ocurrió un error inesperado.'
}
