import { useMutation, useQuery } from '@tanstack/react-query'
import { MapPin, Plus, Store } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Button, Card, EmptyState, ErrorNotice, PageHeader } from '../../components/Ui'
import { apiRequest, ApiError } from '../../core/api/client'
import { queryClient } from '../../core/api/query'
import type { Customer, PaginatedResponse, RetailStore } from '../../core/types/api'
import 'leaflet/dist/leaflet.css'
import './stores.css'

const locationOf = (store: RetailStore): [number, number] => 'coordinates' in store.retail_store_location
  ? [store.retail_store_location.coordinates[1], store.retail_store_location.coordinates[0]]
  : [store.retail_store_location.latitude, store.retail_store_location.longitude]

export function StoresPage() {
  const [customerCode, setCustomerCode] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ name: '', city: '', latitude: '-25.2867', longitude: '-57.3333' })

  const customers = useQuery({ queryKey: ['customers', 'store-selector'], queryFn: () => apiRequest<PaginatedResponse<Customer>>('/data/customers/?ordering=customer_name&page_size=100') })
  useEffect(() => { if (!customerCode && customers.data?.results[0]) setCustomerCode(customers.data.results[0].customer_code) }, [customerCode, customers.data])
  const stores = useQuery({
    queryKey: ['stores', customerCode], enabled: Boolean(customerCode),
    queryFn: () => apiRequest<PaginatedResponse<RetailStore>>(`/data/customers/${customerCode}/retail-store/?ordering=retail_store_name&page_size=100`),
  })
  const createStore = useMutation({
    mutationFn: () => apiRequest<void>(`/data/customers/${customerCode}/retail-store/`, {
      method: 'POST', body: JSON.stringify({ retail_store_name: draft.name, retail_store_city: draft.city, retail_store_location: { latitude: Number(draft.latitude), longitude: Number(draft.longitude) } }),
    }),
    onSuccess: async () => { setShowForm(false); await queryClient.invalidateQueries({ queryKey: ['stores', customerCode] }) },
  })
  const submit = (event: FormEvent) => { event.preventDefault(); createStore.mutate() }
  const error = customers.error ?? stores.error ?? createStore.error
  const mapCenter: [number, number] = stores.data?.results[0] ? locationOf(stores.data.results[0]) : [-25.2867, -57.3333]

  return (
    <>
      <PageHeader eyebrow="Territorio" title="Locales y mapa" description="Visualizá la presencia comercial y sumá nuevos puntos de venta." actions={<Button disabled={!customerCode} onClick={() => setShowForm(true)}><Plus />Nuevo local</Button>} />
      <Card className="store-selector"><label>Cliente<select aria-label="Seleccionar cliente" value={customerCode} onChange={(event) => setCustomerCode(event.target.value)}><option value="">Seleccioná un cliente</option>{customers.data?.results.map((customer) => <option key={customer.customer_code} value={customer.customer_code}>{customer.customer_name}</option>)}</select></label><span><MapPin />{stores.data?.count ?? 0} ubicaciones</span></Card>
      {error && <ErrorNotice message={error instanceof ApiError ? error.message : 'No pudimos cargar los locales.'} />}
      {showForm && <Card className="store-form"><form onSubmit={submit}><label>Nombre<input aria-label="Nombre del local" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label><label>Ciudad<input aria-label="Ciudad" value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} required /></label><label>Latitud<input aria-label="Latitud" type="number" step="any" value={draft.latitude} onChange={(event) => setDraft({ ...draft, latitude: event.target.value })} required /></label><label>Longitud<input aria-label="Longitud" type="number" step="any" value={draft.longitude} onChange={(event) => setDraft({ ...draft, longitude: event.target.value })} required /></label><div><Button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={createStore.isPending}>Guardar</Button></div></form></Card>}
      {!customerCode ? <EmptyState title="Seleccioná un cliente" description="Los locales se organizan dentro de la cartera de cada cliente." /> : (
        <div className="stores-layout">
          <Card className="store-list"><p className="eyebrow">Puntos de venta</p>{stores.isLoading ? <p>Cargando locales…</p> : stores.data?.results.length ? stores.data.results.map((store) => <article key={store.retail_store_code}><span><Store /></span><div><h2>{store.retail_store_name}</h2><p>{store.retail_store_city}</p></div><small>{locationOf(store).map((value) => value.toFixed(4)).join(', ')}</small></article>) : <p className="store-empty">Este cliente todavía no tiene locales.</p>}</Card>
          <Card className="store-map"><MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={12} scrollWheelZoom><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{stores.data?.results.map((store) => <Marker key={store.retail_store_code} position={locationOf(store)}><Popup><strong>{store.retail_store_name}</strong><br />{store.retail_store_city}</Popup></Marker>)}</MapContainer></Card>
        </div>
      )}
    </>
  )
}
