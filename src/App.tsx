import { BrowserRouter, useLocation } from 'react-router-dom'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { registerLogoutCallback } from './lib/api'
import { statusApi } from './lib/api'
import { AppRouter } from './router'
import { ToastProvider } from './components/ui/Toast'
import VerifyingOverlay from './components/ui/VerifyingOverlay'
import { useAuthStore } from './stores/authStore'
import { QK } from './lib/queryKeys'

// Limpiar caché de React Query en cada logout / 401
registerLogoutCallback(() => queryClient.clear())

// ── Rutas donde NUNCA se muestra el overlay ───────────────────────────────────
// Las rutas públicas no tienen sesión activa, pero por si acaso:
const PUBLIC_ROUTE_PREFIXES = ['/login', '/firma/', '/activar', '/auth/callback']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  )
}

// ── Capa de verificación de sesión ────────────────────────────────────────────
// Se monta dentro de BrowserRouter para acceder a useLocation.

function SessionVerifier({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const onPublic = isPublicRoute(location.pathname)

  // Solo dispara la query si el usuario está autenticado y NO es ruta pública.
  // staleTime 60s (Redis cachea 60s en backend). La query se resuelve en <300ms
  // normalmente; el overlay desaparece en cuanto isLoading pasa a false.
  // En el peor caso el overlay es visible ~2s hasta timeout del backend.
  const { isLoading } = useQuery({
    queryKey: QK.userContext(),
    queryFn: () => statusApi.getUserContext().then((r) => r.data),
    enabled: isAuthenticated && !onPublic,
    staleTime: 60_000,
    retry: 1,
  })

  const showOverlay = isAuthenticated && !onPublic && isLoading

  return (
    <>
      <VerifyingOverlay visible={showOverlay} variant="fullscreen" />
      {children}
    </>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SessionVerifier>
            <AppRouter />
          </SessionVerifier>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
