import { useQuery } from '@tanstack/react-query'
import { BarChart3, Building2, DatabaseZap, Store } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, ErrorNotice, PageHeader } from '../../components/Ui'
import { apiRequest } from '../../core/api/client'
import type { Customer, PaginatedResponse, RetailStore } from '../../core/types/api'
import './reports.css'

interface ReportSeriesPoint {
  label: string
  value: number
}

interface ReportResponse {
  Report?: string
  series?: ReportSeriesPoint[]
}

const previewSeries: ReportSeriesPoint[] = [
  { label: 'Ene', value: 32 },
  { label: 'Feb', value: 41 },
  { label: 'Mar', value: 38 },
  { label: 'Abr', value: 52 },
  { label: 'May', value: 58 },
  { label: 'Jun', value: 65 },
]

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note: string }) {
  return (
    <Card className="metric-card">
      <span className="metric-icon" aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </Card>
  )
}

export function ReportsDashboard() {
  const customersQuery = useQuery({
    queryKey: ['customers', 'dashboard'],
    queryFn: () => apiRequest<PaginatedResponse<Customer>>('/data/customers/'),
  })
  const selectedCustomer = customersQuery.data?.results[0]
  const storesQuery = useQuery({
    queryKey: ['stores', 'dashboard', selectedCustomer?.customer_code],
    queryFn: () => apiRequest<PaginatedResponse<RetailStore>>(`/data/customers/${selectedCustomer?.customer_code}/retail-store/`),
    enabled: Boolean(selectedCustomer),
  })
  const reportQuery = useQuery({
    queryKey: ['reports', selectedCustomer?.customer_code],
    queryFn: () => apiRequest<ReportResponse>(`/data/customers/${selectedCustomer?.customer_code}/reports/`),
    enabled: Boolean(selectedCustomer),
  })

  const hasRealSeries = Boolean(reportQuery.data?.series?.length)
  const series = hasRealSeries ? reportQuery.data?.series ?? [] : previewSeries
  const customerCount = customersQuery.data?.count ?? 0
  const storeCount = storesQuery.data?.count ?? 0
  const coverage = [
    { label: 'Clientes', total: customerCount },
    { label: 'Locales', total: storeCount },
  ]
  const error = customersQuery.error ?? storesQuery.error ?? reportQuery.error

  return (
    <div className="reports-page">
      <PageHeader
        eyebrow="Pulso comercial"
        title="Tu negocio, en perspectiva"
        description="Indicadores claros para decidir el siguiente movimiento. Los totales se sincronizan con el backend actual."
        actions={<span className={`report-status ${reportQuery.data ? 'connected' : ''}`}><DatabaseZap />{reportQuery.data ? 'Backend conectado' : 'Sincronizando'}</span>}
      />

      {error && <ErrorNotice message={error.message} />}

      {!hasRealSeries && (
        <div className="preview-notice" role="status">
          <BarChart3 aria-hidden="true" />
          <div><strong>Vista preliminar</strong><span>La tendencia usa datos de referencia hasta que el backend publique series históricas. Los totales superiores sí son reales.</span></div>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard icon={<Building2 />} label="Clientes conectados" value={customersQuery.isPending ? '—' : customerCount} note="Total disponible en la API" />
        <MetricCard icon={<Store />} label="Locales del cliente" value={storesQuery.isPending ? '—' : storeCount} note={selectedCustomer?.customer_name ?? 'Sin cliente disponible'} />
        <MetricCard icon={<DatabaseZap />} label="Estado del reporte" value={reportQuery.isPending ? 'Consultando' : reportQuery.data ? 'Disponible' : 'Pendiente'} note={reportQuery.data?.Report ?? 'Esperando respuesta del servicio'} />
      </div>

      <div className="charts-grid">
        <Card className="chart-card trend-chart">
          <div className="chart-heading">
            <div><p className="eyebrow">Evolución</p><h2>Tendencia mensual</h2></div>
            <span className={hasRealSeries ? 'data-badge real' : 'data-badge'}>{hasRealSeries ? 'Datos del backend' : 'Datos de referencia'}</span>
          </div>
          <div className="chart-frame" aria-label="Gráfico de tendencia mensual">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs><linearGradient id="mateArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5f8064" stopOpacity={0.42} /><stop offset="95%" stopColor="#5f8064" stopOpacity={0.04} /></linearGradient></defs>
                <CartesianGrid stroke="#e5e9e1" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#65736e', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#65736e', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#dce3da' }} />
                <Area type="monotone" dataKey="value" name="Índice" stroke="#315f50" strokeWidth={3} fill="url(#mateArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="chart-card">
          <div className="chart-heading">
            <div><p className="eyebrow">Cobertura</p><h2>Datos disponibles</h2></div>
            <span className="data-badge real">Datos reales</span>
          </div>
          <div className="chart-frame" aria-label="Gráfico de cobertura de datos">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverage} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e5e9e1" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#65736e', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#65736e', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#eef2e8' }} contentStyle={{ borderRadius: 12, borderColor: '#dce3da' }} />
                <Bar dataKey="total" name="Total" fill="#87a46f" radius={[8, 8, 2, 2]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ReportsDashboard
