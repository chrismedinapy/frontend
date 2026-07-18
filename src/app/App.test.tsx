import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { queryClient } from '../core/api/query'
import { session } from '../core/auth/session'
import { App } from './App'

describe('App', () => {
  afterEach(() => session.clear())

  it('shows the authentication entry point for anonymous users', () => {
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/login']}><App /></MemoryRouter></QueryClientProvider>)
    expect(screen.getByText('Acceso en preparación')).toBeInTheDocument()
  })

  it.each([
    ['/dashboard', 'Tu negocio, en perspectiva'],
    ['/customers', 'Módulo en preparación'],
    ['/stores', 'Locales y mapa'],
    ['/uploads', 'Carga de archivos'],
  ])('renders the protected module at %s', async (path, expected) => {
    session.write({
      access_token: 'access', refresh_token: 'refresh', token_type: 'Bearer', expires_in: 3600,
      user: { user_code: 'user', name: 'Ana', access_level: 1 },
    })
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></QueryClientProvider>)
    expect(await screen.findByRole('heading', { name: expected })).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('redirects protected routes for anonymous users', () => {
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/customers']}><App /></MemoryRouter></QueryClientProvider>)
    expect(screen.getByText('Acceso en preparación')).toBeInTheDocument()
  })
})
