import { http } from './client'
import { object, string } from './parse'

export function fetchReadiness(signal?: AbortSignal): Promise<string> {
  return http.get('/ready', (data) => string(object(data, 'ready'), 'status'), signal ? { signal } : {})
}
