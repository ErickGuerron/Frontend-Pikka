import { ApiError, userMessage } from '@/shared/api/errors'

export const INACTIVE_ACCOUNT_MESSAGE = 'Tu cuenta está desactivada. Contacta a un administrador.'

/** Login-only: the gateway answers a deactivated account with 403, which elsewhere means "no permission". */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return INACTIVE_ACCOUNT_MESSAGE
  return userMessage(error)
}
