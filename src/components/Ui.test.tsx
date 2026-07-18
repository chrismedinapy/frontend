import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button, Card, EmptyState, ErrorNotice, PageHeader } from './Ui'

describe('UI primitives', () => {
  it('renders and activates the shared button', () => {
    const action = vi.fn()
    render(<Button onClick={action}>Guardar</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it('renders cards, headers, empty states and errors', () => {
    render(<><PageHeader eyebrow="Datos" title="Título" description="Detalle" actions={<span>Acción</span>} /><Card>Contenido</Card><EmptyState title="Vacío" description="Sin datos" /><ErrorNotice message="Error" /></>)
    expect(screen.getByRole('heading', { name: 'Título' })).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vacío' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Error')
  })
})
