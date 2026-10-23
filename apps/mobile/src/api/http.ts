import { ApiError } from './errors'
import { isRecord } from './parse'

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
  put<T>(path: string, parse: Parser<T>, options?: RequestOptions): Promise<T>
  patch<T>(path: string, parse: Parser<T>, options?: RequestOptions): Promise<T>
  delete<T>(path: string, parse: Parser<T>, options?: RequestOptions): Promise<T>
}

/** Single point in mobile that talks HTTP to the API Gateway. */
export function createHttpClient({ baseUrl, getToken, onUnauthorized }: HttpClientOptions): HttpClient {
  async function request<T>(
    method: string,
    path: string,
    parse: Parser<T>,
    options: RequestOptions = {}
  ): Promise<T> {
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
      if (cause instanceof Error && cause.name === 'AbortError') throw cause
      throw new ApiError(0, 'NETWORK', 'network error')
    }

    const data: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const error = toApiError(response.status, data)
      // 401 with a token = expired/revoked session; without a token (login) it is just bad credentials.
      if (response.status === 401 && token) onUnauthorized()
      throw error
    }
    try {
      return parse(data)
    } catch {
      throw new ApiError(response.status, 'BAD_RESPONSE', 'unexpected response shape')
    }
  }

  return {
    get: (path, parse, options) => request('GET', path, parse, options),
    post: (path, parse, options) => request('POST', path, parse, options),
    put: (path, parse, options) => request('PUT', path, parse, options),
    patch: (path, parse, options) => request('PATCH', path, parse, options),
    delete: (path, parse, options) => request('DELETE', path, parse, options),
  }
}

function toApiError(status: number, data: unknown): ApiError {
  if (isRecord(data) && isRecord(data.error)) {
    const { code, message, requestId } = data.error
    return new ApiError(
      status,
      typeof code === 'string' ? code : 'ERROR',
      typeof message === 'string' ? message : 'error',
      typeof requestId === 'string' ? requestId : undefined
    )
  }
  return new ApiError(status, 'ERROR', `HTTP ${String(status)}`)
}

