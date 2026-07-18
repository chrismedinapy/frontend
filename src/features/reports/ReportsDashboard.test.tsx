import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../core/api/client'
import { ReportsDashboard } from './ReportsDashboard'

vi.mock('../../core/api/client', () => ({ apiRequest: vi.fn() }))
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  BarChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Area: () => null,
  Bar: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}))

const requestMock = vi.mocked(apiRequest)

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><ReportsDashboard /></QueryClientProvider>)
}

describe('ReportsDashboard', () => {
  beforeEach(() => {
    requestMock.mockImplementation(async (path) => {
      if (path === '/data/customers/') return { count: 2, next: null, previous: null, results: [{ customer_code: 'customer-1', customer_name: 'Mate Norte', customer_description: '' }] }
      if (path.includes('/retail-store/')) return { count: 3, next: null, previous: null, results: [] }
      return { Report: 'SUCCESSFULLY' }
    })
  })

  it('shows real API totals and labels preview series honestly', async () => {
    renderDashboard()

    expect(screen.getByRole('heading', { name: 'Tu negocio, en perspectiva' })).toBeInTheDocument()
    expect(screen.getByText('Vista preliminar')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Backend conectado')).toBeInTheDocument()
    })
    expect(requestMock).toHaveBeenCalledWith('/data/customers/customer-1/reports/')
  })

  it('uses report series when the backend provides them', async () => {
    requestMock.mockImplementation(async (path) => {
      if (path === '/data/customers/') return { count: 1, next: null, previous: null, results: [{ customer_code: 'customer-1', customer_name: 'Mate Norte', customer_description: '' }] }
      if (path.includes('/retail-store/')) return { count: 1, next: null, previous: null, results: [] }
      return { Report: 'READY', series: [{ label: 'Jul', value: 72 }] }
    })
    renderDashboard()

    await waitFor(() => expect(screen.getByText('Datos del backend')).toBeInTheDocument())
    expect(screen.queryByText('Vista preliminar')).not.toBeInTheDocument()
  })
})
