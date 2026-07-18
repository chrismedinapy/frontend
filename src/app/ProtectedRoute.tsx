import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { session } from '../core/auth/session'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  if (!session.isAuthenticated()) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
