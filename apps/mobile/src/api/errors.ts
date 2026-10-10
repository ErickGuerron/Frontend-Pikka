/** Error with API Gateway format: {"error":{"code","message","requestId"}}. */
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
  UPSTREAM_UNAVAILABLE: 'El servicio no está disponible. Intenta más tarde.',
  UPSTREAM_TIMEOUT: 'El servicio tardó demasiado en responder.',
  NETWORK: 'No se pudo conectar con el servidor.',
}

/** Message to show user from any error. */
export function userMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_ARGUMENT') return `Datos inválidos: ${error.message}.`
    return messages[error.code] ?? 'Ocurrió un error inesperado.'
  }
  return 'Ocurrió un error inesperado.'
}
