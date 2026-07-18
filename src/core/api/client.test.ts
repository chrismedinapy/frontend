import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from '../auth/session'
import { apiRequest } from './client'

describe('apiRequest', () => {
  beforeEach(() => {
    session.write({
      access_token: 'access', refresh_token: 'refresh', token_type: 'Bearer', expires_in: 60,
      user: { user_code: 'abc', name: 'Mara', access_level: 1 },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    session.clear()
  })

  it('adds the bearer token and parses JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiRequest<{ ok: boolean }>('/data/customers/')).resolves.toEqual({ ok: true })
    const [, request] = fetchMock.mock.calls[0]
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer access')
  })

  it('normalizes backend errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'invalid_parameter', message: 'Dato inválido', fields: { name: ['Requerido'] } },
    }), { status: 400, headers: { 'Content-Type': 'application/json' } })))
    await expect(apiRequest('/data/customers/')).rejects.toMatchObject({
      status: 400, code: 'invalid_parameter', message: 'Dato inválido', fields: { name: ['Requerido'] },
    })
  })

  it('rotates an expired access token once and retries', async () => {
    const rotated = { ...session.read()!, access_token: 'new-access', refresh_token: 'new-refresh' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(rotated), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiRequest<void>('/data/customers/', { method: 'DELETE' })).resolves.toBeUndefined()
    expect(session.accessToken()).toBe('new-access')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
