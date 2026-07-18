import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react'

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`.trim()} {...props} />
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`card ${className}`.trim()}>{children}</section>
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="empty-state">
      <span className="empty-mark" aria-hidden="true">D</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </Card>
  )
}

export function ErrorNotice({ message }: { message: string }) {
  return <div className="error-notice" role="alert">{message}</div>
}
