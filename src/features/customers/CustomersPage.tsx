import { useMutation, useQuery } from '@tanstack/react-query'
import { Building2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, ErrorNotice, PageHeader } from '../../components/Ui'
import { apiRequest, ApiError } from '../../core/api/client'
import { queryClient } from '../../core/api/query'
import type { Customer, PaginatedResponse } from '../../core/types/api'
import './customers.css'

interface CustomerDraft { customer_name: string; customer_description: string }
const emptyDraft: CustomerDraft = { customer_name: '', customer_description: '' }

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [showForm, setShowForm] = useState(false)

  const customers = useQuery({
    queryKey: ['customers', search],
    queryFn: () => apiRequest<PaginatedResponse<Customer>>(`/data/customers/?search=${encodeURIComponent(search)}&ordering=customer_name&page_size=100`),
  })

  const save = useMutation({
    mutationFn: () => apiRequest<Customer | void>(editing ? `/data/customers/${editing.customer_code}/` : '/data/customers/', {
      method: editing ? 'PUT' : 'POST', body: JSON.stringify(draft),
    }),
    onSuccess: async () => {
      setShowForm(false); setEditing(null); setDraft(emptyDraft)
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const remove = useMutation({
    mutationFn: (code: string) => apiRequest<void>(`/data/customers/${code}/`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  })

  const submit = (event: FormEvent) => { event.preventDefault(); if (draft.customer_name.trim() && draft.customer_description.trim()) save.mutate() }
  const startEdit = (customer: Customer) => { setEditing(customer); setDraft({ customer_name: customer.customer_name, customer_description: customer.customer_description }); setShowForm(true) }
  const error = customers.error ?? save.error ?? remove.error

  return (
    <>
      <PageHeader eyebrow="Cartera" title="Clientes" description="Administrá las organizaciones que confían sus datos a DataCore." actions={<Button onClick={() => { setEditing(null); setDraft(emptyDraft); setShowForm(true) }}><Plus />Nuevo cliente</Button>} />
      <Card className="customer-toolbar"><label><Search /><input aria-label="Buscar clientes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o descripción" /></label><span>{customers.data?.count ?? 0} clientes</span></Card>
      {error && <ErrorNotice message={error instanceof ApiError ? error.message : 'No pudimos cargar los clientes.'} />}
      {showForm && <Card className="customer-form-card"><form onSubmit={submit}><div><p className="eyebrow">{editing ? 'Editar' : 'Nuevo'}</p><h2>{editing ? editing.customer_name : 'Crear cliente'}</h2></div><label>Nombre<input aria-label="Nombre del cliente" maxLength={100} value={draft.customer_name} onChange={(event) => setDraft({ ...draft, customer_name: event.target.value })} required /></label><label>Descripción<textarea aria-label="Descripción del cliente" maxLength={200} value={draft.customer_description} onChange={(event) => setDraft({ ...draft, customer_description: event.target.value })} required /></label><div className="customer-form-actions"><Button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Guardando…' : 'Guardar cliente'}</Button></div></form></Card>}
      {customers.isLoading ? <div className="customer-grid">{[1,2,3].map((item) => <Card key={item} className="customer-skeleton" />)}</div> : customers.data?.results.length ? (
        <div className="customer-grid">{customers.data.results.map((customer) => <Card key={customer.customer_code} className="customer-card"><div className="customer-icon"><Building2 /></div><div><h2>{customer.customer_name}</h2><p>{customer.customer_description}</p><small>{customer.customer_code}</small></div><div className="customer-actions"><button onClick={() => startEdit(customer)} aria-label={`Editar ${customer.customer_name}`}><Pencil /></button><button onClick={() => window.confirm(`¿Eliminar ${customer.customer_name}?`) && remove.mutate(customer.customer_code)} aria-label={`Eliminar ${customer.customer_name}`}><Trash2 /></button></div></Card>)}</div>
      ) : <EmptyState title="Todavía no hay clientes" description="Creá el primero para empezar a organizar locales, datasets y reportes." />}
    </>
  )
}
