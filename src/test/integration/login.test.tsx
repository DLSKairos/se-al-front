import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../msw/server'
import { renderWithProviders, clearAuthStore } from '../utils/renderWithProviders'
import { useAuthStore } from '@/stores/authStore'
import LoginPage from '@/pages/login/LoginPage'

// Mockeamos useToast para evitar la necesidad de ToastProvider
vi.mock('@/components/ui/Toast', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/components/ui/Toast')>()
  return {
    ...original,
    useToast: () => ({
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    }),
  }
})

// El SplashScreen tiene un timeout de ~3.3s antes de llamar onDone.
// Lo mockeamos con un componente que llama onDone via useEffect para no
// mutar estado durante el render de otro componente.
vi.mock('@/components/ui/SplashScreen', async () => {
  const React = await import('react')
  return {
    SplashScreen: ({ onDone }: { onDone: () => void }) => {
      React.useEffect(() => { onDone() }, [])
      return null
    },
  }
})

// La autenticación WebAuthn no está disponible en jsdom
vi.mock('@/lib/webauthn', () => ({
  authenticateWebAuthn: vi.fn().mockRejectedValue(new Error('not supported')),
  registerWebAuthnPublic: vi.fn().mockRejectedValue(new Error('not supported')),
  checkWebAuthnSupport: vi.fn().mockResolvedValue(false),
  WebAuthnError: class WebAuthnError extends Error {
    code: string
    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  },
}))

// La URL base de la API en test viene de VITE_API_URL (.env.local = https://localhost:3000/api)
// o del fallback en api.ts (http://localhost:3000/api). Usamos wildcard para cubrir ambos.
const API = 'https://localhost:3000/api'

// Handler MSW para el endpoint de verificación de PIN status (responde que el usuario existe y tiene PIN configurado)
const pinStatusHandler = http.post(`${API}/auth/pin/status`, () =>
  HttpResponse.json({ pinEnabled: true, pinConfigured: true })
)

// Handler para verificar PIN con éxito (devuelve token de OPERATOR)
const pinVerifySuccessHandler = http.post(`${API}/auth/pin/verify`, () =>
  HttpResponse.json({ access_token: buildOperatorToken() })
)

// Handler para verificar PIN con error 401
const pinVerifyErrorHandler = http.post(`${API}/auth/pin/verify`, () =>
  new HttpResponse(null, { status: 401 })
)

function buildOperatorToken(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: 'user-operator-001',
      orgId: 'org-test-001',
      role: 'OPERATOR',
      jobTitle: 'Operador de campo',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  )
  return `${header}.${payload}.test-signature`
}

describe('LoginPage', () => {
  beforeEach(() => {
    clearAuthStore()
  })

  afterEach(() => {
    clearAuthStore()
    vi.restoreAllMocks()
  })

  it('should render the cedula form on load', () => {
    // Arrange & Act
    renderWithProviders(<LoginPage />)

    // Assert
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/número de identificación/i)).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toBeInTheDocument()
  })

  it('should allow user to type their cedula', () => {
    // Arrange
    renderWithProviders(<LoginPage />)
    const input = screen.getByLabelText(/número de identificación/i)

    // Act
    fireEvent.change(input, { target: { value: '1020304050' } })

    // Assert
    expect(input).toHaveValue('1020304050')
  })

  it('should disable submit button when cedula is empty', () => {
    // Arrange
    renderWithProviders(<LoginPage />)
    const submitButton = screen.getByTestId('login-submit')

    // Assert
    expect(submitButton).toBeDisabled()
  })

  it('should save token in authStore after successful PIN verification', async () => {
    // Arrange
    server.use(pinStatusHandler, pinVerifySuccessHandler)
    renderWithProviders(<LoginPage />)

    // Act — ingresar cédula y continuar
    const input = screen.getByLabelText(/número de identificación/i)
    fireEvent.change(input, { target: { value: '1020304050' } })
    fireEvent.submit(screen.getByTestId('login-form'))

    // Esperar a que aparezca el teclado numérico de PIN
    await waitFor(() => {
      expect(screen.getByRole('group', { name: /teclado numérico/i })).toBeInTheDocument()
    })

    // Ingresar 4 dígitos de PIN
    const buttons = screen.getAllByRole('button', { name: /^[0-9]$/ })
    fireEvent.click(buttons[0]) // 1
    fireEvent.click(buttons[1]) // 2
    fireEvent.click(buttons[2]) // 3
    fireEvent.click(buttons[3]) // 4

    // Presionar "Entrar"
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert — el token debe estar en el store
    await waitFor(() => {
      const { token } = useAuthStore.getState()
      expect(token).toBeTruthy()
    })
  })

  it('should show error message when PIN verification returns 401', async () => {
    // Arrange
    server.use(pinStatusHandler, pinVerifyErrorHandler)
    renderWithProviders(<LoginPage />)

    // Act — ingresar cédula y continuar
    const input = screen.getByLabelText(/número de identificación/i)
    fireEvent.change(input, { target: { value: '1020304050' } })
    fireEvent.submit(screen.getByTestId('login-form'))

    // Esperar al step de PIN
    await waitFor(() => {
      expect(screen.getByRole('group', { name: /teclado numérico/i })).toBeInTheDocument()
    })

    // Ingresar 4 dígitos y confirmar
    const buttons = screen.getAllByRole('button', { name: /^[0-9]$/ })
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    fireEvent.click(buttons[2])
    fireEvent.click(buttons[3])
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert — mensaje de error visible
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument()
    })
  })

  it('should show loading state while PIN verification is in flight', async () => {
    // Arrange — handler que tarda en responder
    let resolveRequest: (value: Response) => void
    const slowHandler = http.post(`${API}/auth/pin/verify`, () =>
      new Promise<Response>((resolve) => {
        resolveRequest = resolve
      })
    )
    server.use(pinStatusHandler, slowHandler)
    renderWithProviders(<LoginPage />)

    // Act
    const input = screen.getByLabelText(/número de identificación/i)
    fireEvent.change(input, { target: { value: '1020304050' } })
    fireEvent.submit(screen.getByTestId('login-form'))

    await waitFor(() => {
      expect(screen.getByRole('group', { name: /teclado numérico/i })).toBeInTheDocument()
    })

    const buttons = screen.getAllByRole('button', { name: /^[0-9]$/ })
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    fireEvent.click(buttons[2])
    fireEvent.click(buttons[3])
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert — botón muestra loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verificando/i })).toBeInTheDocument()
    })

    // Cleanup — resolver la petición pendiente
    resolveRequest!(HttpResponse.json({ access_token: buildOperatorToken() }) as unknown as Response)
  })
})
