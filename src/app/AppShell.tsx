import { BarChart3, Building2, FileUp, LogOut, MapPinned, Menu, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { session } from '../core/auth/session'

const links = [
  { to: '/dashboard', label: 'Resumen', icon: BarChart3 },
  { to: '/customers', label: 'Clientes', icon: Building2 },
  { to: '/stores', label: 'Locales y mapa', icon: MapPinned },
  { to: '/uploads', label: 'Carga de datos', icon: FileUp },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const user = session.read()?.user

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  const signOut = () => {
    session.clear()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <button className="mobile-menu" onClick={() => setOpen((value) => !value)} aria-label="Abrir navegación"><Menu /></button>
      <aside className={open ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="brand"><span className="brand-mark"><Sprout /></span><span>DataCore<small>Retail intelligence</small></span></div>
        <nav aria-label="Navegación principal">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon /><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() ?? 'D'}</span>
          <span><strong>{user?.name ?? 'DataCore'}</strong><small>Cuenta activa</small></span>
          <button onClick={signOut} aria-label="Cerrar sesión"><LogOut /></button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  )
}
