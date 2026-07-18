import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomersPage } from './CustomersPage'

const request = vi.fn()
vi.mock('../../core/api/client', () => ({ apiRequest: (...args: unknown[]) => request(...args), ApiError: class ApiError extends Error {} }))

describe('CustomersPage', () => {
  beforeEach(() => request.mockReset())

  it('lists customers and opens the creation form', async () => {
    request.mockResolvedValue({ count: 1, next: null, previous: null, results: [{ customer_code: 'c-1', customer_name: 'Verde Mercado', customer_description: 'Cadena de cercanía' }] })
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CustomersPage /></QueryClientProvider>)
    expect(await screen.findByRole('heading', { name: 'Verde Mercado' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Nuevo cliente/ }))
    await userEvent.type(screen.getByLabelText('Nombre del cliente'), 'Nuevo cliente')
    await userEvent.type(screen.getByLabelText('Descripción del cliente'), 'Descripción comercial')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(request).toHaveBeenCalledWith('/data/customers/', expect.objectContaining({ method: 'POST' }))
    await userEvent.type(screen.getByLabelText('Buscar clientes'), 'verde')
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Verde Mercado' }))
    expect(screen.getByDisplayValue('Verde Mercado')).toBeInTheDocument()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Verde Mercado' }))
    expect(request).toHaveBeenCalledWith('/data/customers/c-1/', { method: 'DELETE' })
  })
})
