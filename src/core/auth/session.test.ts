import { beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from './session'

const tokens = {
  access_token: 'access', refresh_token: 'refresh', token_type: 'Bearer' as const, expires_in: 60,
  user: { user_code: 'abc', name: 'Mara', access_level: 1 },
}

describe('session', () => {
  beforeEach(() => localStorage.clear())

  it('writes and reads token data', () => {
    const listener = vi.fn()
    window.addEventListener('datacore:session', listener)
    session.write(tokens)
    expect(session.read()).toEqual(tokens)
    expect(session.accessToken()).toBe('access')
    expect(session.isAuthenticated()).toBe(true)
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('datacore:session', listener)
  })

  it('clears invalid and explicit sessions', () => {
    localStorage.setItem('datacore.session', '{bad')
    expect(session.read()).toBeNull()
    session.write(tokens)
    session.clear()
    expect(session.read()).toBeNull()
    expect(session.isAuthenticated()).toBe(false)
  })
})
