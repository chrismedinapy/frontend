import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

const request = vi.fn()
vi.mock('../../core/api/client', () => ({
  apiRequest: (...args: unknown[]) => request(...args),
  ApiError: class ApiError extends Error {},
}))

function renderPage(path: string) {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={[path]}><Routes><Route path="/login" element={<AuthPage />} /><Route path="/signup" element={<AuthPage />} /><Route path="/dashboard" element={<h1>Dashboard</h1>} /></Routes></MemoryRouter></QueryClientProvider>)
}

describe('AuthPage', () => {
  beforeEach(() => { request.mockReset(); localStorage.clear() })

  it('authenticates and redirects to the dashboard', async () => {
    request.mockResolvedValue({ access_token: 'a', refresh_token: 'r', token_type: 'Bearer', expires_in: 60, user: { user_code: 'u', name: 'Eva', access_level: 1 } })
    renderPage('/login')
    await userEvent.type(screen.getByLabelText('Usuario'), 'evita')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto')
    await userEvent.click(screen.getByRole('button', { name: /Ingresar/ }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(localStorage.getItem('datacore.session')).toContain('access_token')
  })

  it('renders the complete registration journey', () => {
    renderPage('/signup')
    expect(screen.getByRole('heading', { name: 'Creá tu cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
  })
})
