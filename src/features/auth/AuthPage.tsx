import { ArrowRight, CheckCircle2, Leaf, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, ErrorNotice } from '../../components/Ui'
import { apiRequest, ApiError } from '../../core/api/client'
import { session } from '../../core/auth/session'
import type { AuthTokens } from '../../core/types/api'
import './auth.css'

interface AuthForm {
  username: string
  password: string
  name: string
  email: string
  phone_number: string
}

const initialForm: AuthForm = { username: '', password: '', name: '', email: '', phone_number: '' }

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignup = location.pathname === '/signup'
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const update = (field: keyof AuthForm, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (form.username.length < 4 || form.password.length < 6) {
      setError('El usuario debe tener 4 caracteres y la contraseña 6 como mínimo.')
      return
    }
    setPending(true)
    setError(null)
    try {
      if (isSignup) {
        await apiRequest<void>('/data/users/signup/', { method: 'POST', authenticated: false, body: JSON.stringify(form) })
        navigate('/login', { replace: true, state: { registered: true } })
      } else {
        const tokens = await apiRequest<AuthTokens>('/data/users/login/', {
          method: 'POST', authenticated: false,
          body: JSON.stringify({ username: form.username, password: form.password }),
        })
        session.write(tokens)
        navigate('/dashboard', { replace: true })
      }
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos conectar con DataCore.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-brand"><span><Leaf /></span>DataCore</div>
        <div className="auth-story-copy">
          <p className="eyebrow">Retail intelligence</p>
          <h1>Los datos de tu negocio, listos para crecer.</h1>
          <p>Conectá locales, clientes y ventas en una experiencia simple, segura y accionable.</p>
          <ul>
            <li><CheckCircle2 />Información centralizada</li>
            <li><CheckCircle2 />Decisiones con contexto</li>
            <li><ShieldCheck />Acceso protegido con JWT</li>
          </ul>
        </div>
        <small>Diseñado para equipos que convierten información en movimiento.</small>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">{isSignup ? 'Empezá ahora' : 'Bienvenido de nuevo'}</p>
          <h2>{isSignup ? 'Creá tu cuenta' : 'Ingresá a DataCore'}</h2>
          <p>{isSignup ? 'Completá tus datos para preparar tu espacio.' : 'Usá tus credenciales para continuar.'}</p>
          {location.state?.registered && <div className="success-notice">Cuenta creada. Ya podés iniciar sesión.</div>}
          {error && <ErrorNotice message={error} />}
          <form onSubmit={(event) => void submit(event)}>
            {isSignup && (
              <>
                <label className="auth-field"><span>Nombre completo</span><input aria-label="Nombre completo" value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" /></label>
                <div className="auth-row">
                  <label className="auth-field"><span>Correo</span><input aria-label="Correo" value={form.email} onChange={(event) => update('email', event.target.value)} type="email" autoComplete="email" /></label>
                  <label className="auth-field"><span>Teléfono</span><input aria-label="Teléfono" value={form.phone_number} onChange={(event) => update('phone_number', event.target.value)} inputMode="numeric" /></label>
                </div>
              </>
            )}
            <label className="auth-field"><span>Usuario</span><input aria-label="Usuario" value={form.username} onChange={(event) => update('username', event.target.value)} autoComplete="username" /></label>
            <label className="auth-field"><span>Contraseña</span><input aria-label="Contraseña" value={form.password} onChange={(event) => update('password', event.target.value)} type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} /></label>
            <Button type="submit" disabled={pending}>{pending ? 'Procesando…' : isSignup ? 'Crear cuenta' : 'Ingresar'}<ArrowRight /></Button>
          </form>
          <p className="auth-switch">{isSignup ? '¿Ya tenés una cuenta?' : '¿Primera vez en DataCore?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Iniciá sesión' : 'Creá tu cuenta'}</Link></p>
        </div>
      </section>
    </main>
  )
}
