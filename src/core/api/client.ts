import { session } from '../auth/session'
import type { ApiErrorPayload, AuthTokens } from '../types/api'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let refreshRequest: Promise<boolean> | null = null

async function parseError(response: Response) {
  let payload: ApiErrorPayload | undefined
  try {
    payload = (await response.json()) as ApiErrorPayload
  } catch {
    payload = undefined
  }
  return new ApiError(
    response.status,
    payload?.error.code ?? 'request_failed',
    payload?.error.message ?? 'No pudimos completar la solicitud.',
    payload?.error.fields,
  )
}

async function refreshSession() {
  if (refreshRequest) return refreshRequest
  refreshRequest = (async () => {
    const current = session.read()
    if (!current?.refresh_token) return false
    const response = await fetch(`${API_BASE_URL}/data/users/login/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': crypto.randomUUID() },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    })
    if (!response.ok) {
      session.clear()
      return false
    }
    session.write((await response.json()) as AuthTokens)
    return true
  })().finally(() => {
    refreshRequest = null
  })
  return refreshRequest
}

export interface ApiRequestOptions extends RequestInit {
  authenticated?: boolean
  retryAfterRefresh?: boolean
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { authenticated = true, retryAfterRefresh = true, headers, ...requestInit } = options
  const requestHeaders = new Headers(headers)
  requestHeaders.set('X-Request-ID', crypto.randomUUID())
  if (authenticated) {
    const accessToken = session.accessToken()
    if (accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }
  if (requestInit.body && !(requestInit.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(path.startsWith('http') ? path : `${API_BASE_URL}${path}`, {
    ...requestInit,
    headers: requestHeaders,
  })

  if (response.status === 401 && authenticated && retryAfterRefresh && (await refreshSession())) {
    return apiRequest<T>(path, { ...options, retryAfterRefresh: false })
  }
  if (!response.ok) throw await parseError(response)
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T
  return (await response.json()) as T
}
