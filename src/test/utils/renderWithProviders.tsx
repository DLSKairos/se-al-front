import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ReactElement } from 'react'
import { useAuthStore } from '@/stores/authStore'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string
  user?: { token: string }
}

export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/', user, ...options }: RenderWithProvidersOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  if (user) {
    useAuthStore.getState().setToken(user.token)
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Limpia el estado de auth después de cada test que use `user`.
 * Llamar en afterEach si el test pre-carga usuario.
 */
export function clearAuthStore() {
  useAuthStore.getState().clear()
}
