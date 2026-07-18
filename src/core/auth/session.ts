import type { AuthTokens } from '../types/api'

const SESSION_KEY = 'datacore.session'

export const session = {
  read(): AuthTokens | null {
    const value = localStorage.getItem(SESSION_KEY)
    if (!value) return null
    try {
      return JSON.parse(value) as AuthTokens
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },
  write(tokens: AuthTokens) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(tokens))
    window.dispatchEvent(new Event('datacore:session'))
  },
  clear() {
    localStorage.removeItem(SESSION_KEY)
    window.dispatchEvent(new Event('datacore:session'))
  },
  accessToken() {
    return this.read()?.access_token ?? null
  },
  isAuthenticated() {
    return Boolean(this.accessToken())
  },
}
