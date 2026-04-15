import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  redirectTo?: string
}

export function RoleGuard({ allowedRoles, redirectTo = '/login' }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirigir según rol real
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
