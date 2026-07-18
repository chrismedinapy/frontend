import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadsPage } from './UploadsPage'

const request = vi.fn()
vi.mock('../../core/api/client', () => ({ apiRequest: (...args: unknown[]) => request(...args), ApiError: class ApiError extends Error {} }))

describe('UploadsPage', () => {
  beforeEach(() => request.mockImplementation((path = '', options?: RequestInit) => {
    if (options?.method === 'POST') return Promise.resolve()
    if (String(path).includes('/products/')) return Promise.resolve({ count: 0, next: null, previous: null, results: [] })
    if (String(path).includes('/retail-store/')) return Promise.resolve({ count: 1, next: null, previous: null, results: [{ retail_store_code: 's-1', retail_store_name: 'Centro' }] })
    return Promise.resolve({ count: 1, next: null, previous: null, results: [{ customer_code: 'c-1', customer_name: 'Verde Mercado' }] })
  }))

  it('sends the browser-generated multipart contract', async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><UploadsPage /></QueryClientProvider>)
    await screen.findByRole('option', { name: 'Centro' })
    await userEvent.type(screen.getByLabelText('Descripción del archivo'), 'Ventas mensuales')
    const file = new File(['product,quantity\nmate,2'], 'ventas.csv', { type: 'text/csv' })
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), file)
    await userEvent.click(screen.getByRole('button', { name: 'Subir y procesar' }))
    await waitFor(() => expect(request).toHaveBeenCalledWith('/data/customers/c-1/retail-store/s-1/products/', expect.objectContaining({ method: 'POST', body: expect.any(FormData) })))
    const postCall = request.mock.calls.find((call) => call[1]?.method === 'POST')
    expect(postCall?.[1].body.get('customer')).toContain('Ventas mensuales')
    expect(postCall?.[1].body.get('customer_csv')).toBeInstanceOf(File)
  })
})
