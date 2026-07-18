import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, ErrorNotice, PageHeader } from '../../components/Ui'
import { apiRequest, ApiError } from '../../core/api/client'
import { queryClient } from '../../core/api/query'
import type { Customer, CustomerInput, PaginatedResponse, RetailStore } from '../../core/types/api'
import './uploads.css'

export function UploadsPage() {
  const [customerCode, setCustomerCode] = useState('')
  const [storeCode, setStoreCode] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState(false)

  const customers = useQuery({ queryKey: ['customers', 'upload-selector'], queryFn: () => apiRequest<PaginatedResponse<Customer>>('/data/customers/?ordering=customer_name&page_size=100') })
  useEffect(() => { if (!customerCode && customers.data?.results[0]) setCustomerCode(customers.data.results[0].customer_code) }, [customerCode, customers.data])
  const stores = useQuery({ queryKey: ['stores', 'upload-selector', customerCode], enabled: Boolean(customerCode), queryFn: () => apiRequest<PaginatedResponse<RetailStore>>(`/data/customers/${customerCode}/retail-store/?page_size=100`) })
  useEffect(() => { setStoreCode(stores.data?.results[0]?.retail_store_code ?? '') }, [stores.data])
  const inputs = useQuery({
    queryKey: ['inputs', customerCode, storeCode], enabled: Boolean(customerCode && storeCode),
    queryFn: () => apiRequest<PaginatedResponse<CustomerInput>>(`/data/customers/${customerCode}/retail-store/${storeCode}/products/?page_size=20`),
  })
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Seleccioná un archivo CSV.')
      const body = new FormData()
      body.append('customer', JSON.stringify({ customer_input_description: description }))
      body.append('customer_csv', file, file.name)
      return apiRequest<void>(`/data/customers/${customerCode}/retail-store/${storeCode}/products/`, { method: 'POST', body })
    },
    onSuccess: async () => { setUploaded(true); setDescription(''); setFile(null); await queryClient.invalidateQueries({ queryKey: ['inputs', customerCode, storeCode] }) },
  })
  const submit = (event: FormEvent) => { event.preventDefault(); setUploaded(false); upload.mutate() }
  const error = customers.error ?? stores.error ?? inputs.error ?? upload.error

  return (
    <>
      <PageHeader eyebrow="Datos" title="Carga de archivos" description="Sumá ventas y productos al procesamiento asincrónico de DataCore." />
      <div className="upload-layout">
        <Card className="upload-card"><div className="upload-step"><span>1</span><div><h2>Elegí el destino</h2><p>Asociá el dataset a un cliente y uno de sus locales.</p></div></div><div className="upload-selectors"><label>Cliente<select aria-label="Cliente" value={customerCode} onChange={(event) => { setCustomerCode(event.target.value); setStoreCode('') }}><option value="">Seleccioná</option>{customers.data?.results.map((customer) => <option key={customer.customer_code} value={customer.customer_code}>{customer.customer_name}</option>)}</select></label><label>Local<select aria-label="Local" value={storeCode} onChange={(event) => setStoreCode(event.target.value)} disabled={!customerCode}><option value="">Seleccioná</option>{stores.data?.results.map((store) => <option key={store.retail_store_code} value={store.retail_store_code}>{store.retail_store_name}</option>)}</select></label></div>
          <div className="upload-step"><span>2</span><div><h2>Prepará el archivo</h2><p>Solo CSV, con encabezados en la primera fila.</p></div></div><form onSubmit={submit}><label className="upload-description">Descripción<input aria-label="Descripción del archivo" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} placeholder="Ej. Ventas del primer trimestre" required /></label><label className={file ? 'drop-zone drop-zone-ready' : 'drop-zone'}><input aria-label="Archivo CSV" type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setUploaded(false) }} /><UploadCloud /><strong>{file ? file.name : 'Arrastrá o seleccioná tu CSV'}</strong><small>{file ? `${(file.size / 1024).toFixed(1)} KB listo para subir` : 'Máximo recomendado: 25 MB'}</small></label>{error && <ErrorNotice message={error instanceof ApiError ? error.message : error.message} />}{uploaded && <div className="upload-success"><CheckCircle2 />Archivo recibido. DataCore inició su procesamiento.</div>}<Button type="submit" disabled={!customerCode || !storeCode || !file || upload.isPending}>{upload.isPending ? 'Subiendo…' : 'Subir y procesar'}</Button></form>
        </Card>
        <Card className="upload-history"><p className="eyebrow">Actividad reciente</p><h2>Datasets del local</h2>{!storeCode ? <EmptyState title="Elegí un local" description="Acá aparecerán sus cargas recientes." /> : inputs.data?.results.length ? <div>{inputs.data.results.map((item) => <article key={item.customer_input_code}><span><FileSpreadsheet /></span><div><strong>{item.customer_input_description}</strong><small>{item.created_at ? new Date(item.created_at).toLocaleDateString('es-PY') : 'En procesamiento'}</small></div><em>{item.gridfs_code ? 'Procesado' : 'Pendiente'}</em></article>)}</div> : <EmptyState title="Sin cargas todavía" description="El primer CSV que subas aparecerá en este historial." />}</Card>
      </div>
    </>
  )
}
