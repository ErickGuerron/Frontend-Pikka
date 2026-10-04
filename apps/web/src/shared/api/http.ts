import { ApiError } from './errors'

export type Parser<T> = (data: unknown) => T

export interface HttpClientOptions {
  baseUrl: string
  getToken: () => string | null
  onUnauthorized: () => void
}

export interface RequestOptions {
  body?: unknown
  signal?: AbortSignal
}

export interface HttpClient {
  get<T>(path: string, parse: Parser<T>, options?: RequestOptions): Promise<T>
  post<T>(path: string, parse: Parser<T>, options?: RequestOptions): Promise<T>
}

/** Único punto del front que habla HTTP con el API Gateway. */
export function createHttpClient({ baseUrl, getToken, onUnauthorized }: HttpClientOptions): HttpClient {
  async function request<T>(method: string, path: string, parse: Parser<T>, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'

    let response: Response
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: options.body === undefined ? null : JSON.stringify(options.body),
        signal: options.signal ?? null,
      })
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
      throw new ApiError(0, 'NETWORK', 'network error')
    }

    const data: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const error = toApiError(response.status, data)
      // Un token vencido o inválido cierra la sesión; un login fallido no.
      if (response.status === 401 && token) onUnauthorized()
      throw error
    }
    return parse(data)
  }

  return {
    get: (path, parse, options) => request('GET', path, parse, options),
    post: (path, parse, options) => request('POST', path, parse, options),
  }
}

function toApiError(status: number, data: unknown): ApiError {
  if (isRecord(data) && isRecord(data.error)) {
    const { code, message, requestId } = data.error
    return new ApiError(
      status,
      typeof code === 'string' ? code : 'ERROR',
      typeof message === 'string' ? message : 'error',
      typeof requestId === 'string' ? requestId : undefined,
    )
  }
  return new ApiError(status, 'ERROR', `HTTP ${String(status)}`)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
