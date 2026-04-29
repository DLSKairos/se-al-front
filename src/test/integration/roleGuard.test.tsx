import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RoleGuard } from '@/router/guards/RoleGuard'
import { useAuthStore } from '@/stores/authStore'
import { tokens } from '../msw/fixtures/auth.fixtures'
import { clearAuthStore } from '../utils/renderWithProviders'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

/**
 * Renderiza el RoleGuard con las rutas necesarias para verificar redirects.
 * Se incluye /login, / y /admin como destinos de redireccion.
 */
function renderGuard(
  allowedRoles: ('OPERATOR' | 'ADMIN' | 'SUPER_ADMIN')[],
  initialRoute: string
) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          <Route path="/" element={<div data-testid="operator-home">Operator Home</div>} />
          <Route path="/admin" element={<div data-testid="admin-redirect">Admin Redirect</div>} />
          <Route path="/super" element={<div data-testid="super-redirect">Super Redirect</div>} />

          {/* Ruta protegida */}
          <Route element={<RoleGuard allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<div data-testid="protected-content">Contenido protegido</div>} />
            <Route path="/admin/dashboard" element={<div data-testid="admin-content">Panel admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RoleGuard', () => {
  beforeEach(() => {
    clearAuthStore()
  })

  afterEach(() => {
    clearAuthStore()
  })

  it('should redirect unauthenticated user to /login', () => {
    // Arrange — sin token en el store
    // Act
    renderGuard(['OPERATOR'], '/protected')

    // Assert
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should redirect OPERATOR trying to access /admin route to /', () => {
    // Arrange
    useAuthStore.getState().setToken(tokens.OPERATOR)

    // Act
    renderGuard(['ADMIN', 'SUPER_ADMIN'], '/admin/dashboard')

    // Assert — el OPERATOR es redirigido a /
    expect(screen.getByTestId('operator-home')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

  it('should render children when ADMIN accesses admin route', () => {
    // Arrange
    useAuthStore.getState().setToken(tokens.ADMIN)

    // Act
    renderGuard(['ADMIN', 'SUPER_ADMIN'], '/admin/dashboard')

    // Assert
    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })

  it('should render children when SUPER_ADMIN accesses admin route', () => {
    // Arrange
    useAuthStore.getState().setToken(tokens.SUPER_ADMIN)

    // Act
    renderGuard(['ADMIN', 'SUPER_ADMIN'], '/admin/dashboard')

    // Assert
    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })

  it('should redirect ADMIN trying to access OPERATOR-only route to /admin', () => {
    // Arrange
    useAuthStore.getState().setToken(tokens.ADMIN)

    // Act
    renderGuard(['OPERATOR'], '/protected')

    // Assert — el ADMIN es redirigido a /admin
    expect(screen.getByTestId('admin-redirect')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should redirect SUPER_ADMIN trying to access OPERATOR-only route to /super', () => {
    // Arrange
    useAuthStore.getState().setToken(tokens.SUPER_ADMIN)

    // Act
    renderGuard(['OPERATOR'], '/protected')

    // Assert — el SUPER_ADMIN es redirigido a /super
    expect(screen.getByTestId('super-redirect')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
