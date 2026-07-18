import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '../features/auth/AuthPage'
import { CustomersPage } from '../features/customers/CustomersPage'
import { ReportsDashboard } from '../features/reports/ReportsDashboard'
import { StoresPage } from '../features/retail-stores/StoresPage'
import { UploadsPage } from '../features/uploads/UploadsPage'
import { AppShell } from './AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { session } from '../core/auth/session'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ReportsDashboard />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/uploads" element={<UploadsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={session.isAuthenticated() ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
