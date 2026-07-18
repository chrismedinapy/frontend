import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StoresPage } from './StoresPage'

const request = vi.fn()
vi.mock('../../core/api/client', () => ({ apiRequest: (...args: unknown[]) => request(...args), ApiError: class ApiError extends Error {} }))
vi.mock('react-leaflet', () => ({ MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>, TileLayer: () => null, Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))

describe('StoresPage', () => {
  beforeEach(() => request.mockImplementation((path = '') => String(path).includes('retail-store') ? Promise.resolve({ count: 1, next: null, previous: null, results: [{ retail_store_code: 's-1', retail_store_name: 'Centro', retail_store_city: 'Asunción', retail_store_location: { latitude: -25.28, longitude: -57.63 } }] }) : Promise.resolve({ count: 1, next: null, previous: null, results: [{ customer_code: 'c-1', customer_name: 'Verde Mercado', customer_description: 'Retail' }] })))

  it('loads store markers and opens the creation form', async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><StoresPage /></QueryClientProvider>)
    expect(await screen.findByRole('heading', { name: 'Centro' })).toBeInTheDocument()
    expect(screen.getByTestId('map')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Nuevo local/ }))
    expect(screen.getByLabelText('Nombre del local')).toBeInTheDocument()
    expect(screen.getByLabelText('Latitud')).toHaveValue(-25.2867)
  })
})
