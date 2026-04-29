import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../msw/server'
import { clearAuthStore } from '../utils/renderWithProviders'
import { tokens } from '../msw/fixtures/auth.fixtures'
import { formTemplateFixtures } from '../msw/fixtures/formTemplates.fixtures'
import { useAuthStore } from '@/stores/authStore'
import type { FormContext, FormField } from '@/types'
import FillFormPage from '@/pages/operator/FillFormPage'

// La URL base en tests viene de VITE_API_URL en .env.local → https://localhost:3000/api
const API = 'https://localhost:3000/api'

// Mockeamos useToast para evitar la necesidad de ToastProvider
const toastWarning = vi.fn()
const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('@/components/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/components/ui')>()
  return {
    ...original,
    useToast: () => ({
      success: toastSuccess,
      error: toastError,
      warning: toastWarning,
      info: vi.fn(),
    }),
  }
})

// Mockeamos SOSButton para evitar dependencias externas
vi.mock('@/components/ui/SOSButton', () => ({
  SOSButton: () => null,
}))

// ── Fixture de FormContext ────────────────────────────────────────────────────

const templateWithRequiredField = {
  ...formTemplateFixtures[0],
  fields: formTemplateFixtures[0].fields as FormField[],
} // tiene campo SELECT required

const formContextFixture: FormContext = {
  template: templateWithRequiredField,
  last_submission: null,
  is_readonly: false,
}

function makeFormContextHandler() {
  return http.get(`${API}/form-submissions/context/:templateId`, ({ params }) => {
    if (params.templateId === templateWithRequiredField.id) {
      return HttpResponse.json({ success: true, data: formContextFixture })
    }
    return new HttpResponse(null, { status: 404 })
  })
}

// ── Helper de render ─────────────────────────────────────────────────────────

function renderFillFormPage(templateId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  useAuthStore.getState().setToken(tokens.OPERATOR)
  // Asignar workLocation para que la mutation no falle por workLocationId null
  useAuthStore.getState().setWorkLocation('loc-001')

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/form/${templateId}`]}>
        <Routes>
          <Route path="/form/:templateId" element={<FillFormPage />} />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FillFormPage', () => {
  beforeEach(() => {
    server.use(makeFormContextHandler())
  })

  afterEach(() => {
    clearAuthStore()
    vi.clearAllMocks()
  })

  it('should render form fields according to the template returned by MSW', async () => {
    // Arrange & Act
    renderFillFormPage(templateWithRequiredField.id)

    // Assert — el DynamicForm se renderiza con los campos del template
    await waitFor(() => {
      expect(screen.getByTestId('dynamic-form')).toBeInTheDocument()
    })

    // El campo "Estado del equipo" del fixture debe aparecer
    expect(screen.getByText(/estado del equipo/i)).toBeInTheDocument()
  })

  it('should show validation warning when submitting with required fields empty', async () => {
    // Arrange
    renderFillFormPage(templateWithRequiredField.id)

    await waitFor(() => {
      expect(screen.getByTestId('dynamic-form')).toBeInTheDocument()
    })

    // Act — intentar enviar sin llenar los campos required
    const submitButton = screen.getByRole('button', { name: /enviar formulario/i })
    fireEvent.click(submitButton)

    // Assert — se llama al toast de warning con los campos faltantes
    await waitFor(() => {
      expect(toastWarning).toHaveBeenCalledWith(
        expect.stringMatching(/campos requeridos faltantes/i)
      )
    })
  })

  it('should navigate to home after successful submission', async () => {
    // Arrange — sobreescribir handler de POST para que devuelva éxito
    server.use(
      http.post(`${API}/form-submissions`, () =>
        HttpResponse.json({ success: true, data: { id: 'sub-new-001' } })
      )
    )

    renderFillFormPage(templateWithRequiredField.id)

    await waitFor(() => {
      expect(screen.getByTestId('dynamic-form')).toBeInTheDocument()
    })

    // Act — seleccionar un valor válido para el campo SELECT required
    const selectField = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(selectField, { target: { value: 'bueno' } })

    // Enviar el formulario
    const submitButton = screen.getByRole('button', { name: /enviar formulario/i })
    fireEvent.click(submitButton)

    // Assert — navega a home después del submit exitoso
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })

  it('should show error state when context API returns 500', async () => {
    // Arrange — sobreescribir handler para devolver error (tiene precedencia al estar más reciente)
    server.use(
      http.get(`${API}/form-submissions/context/:templateId`, () =>
        new HttpResponse(null, { status: 500 })
      )
    )

    // Act
    renderFillFormPage(templateWithRequiredField.id)

    // Assert — mensaje de error visible
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })
  })
})
