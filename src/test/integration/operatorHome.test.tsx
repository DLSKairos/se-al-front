import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../msw/server'
import { renderWithProviders, clearAuthStore } from '../utils/renderWithProviders'
import { useAuthStore } from '@/stores/authStore'
import { tokens } from '../msw/fixtures/auth.fixtures'
import { formTemplateFixtures } from '../msw/fixtures/formTemplates.fixtures'
import OperatorHomePage from '@/pages/operator/OperatorHomePage'

// La URL base en tests viene de VITE_API_URL en .env.local → https://localhost:3000/api
const API = 'https://localhost:3000/api'

// Mockeamos StoryIntro para evitar animaciones y lógica de juego
vi.mock('@/components/game/StoryIntro', () => ({
  default: () => <div data-testid="story-intro">StoryIntro</div>,
}))

// Mockeamos SOSButton para evitar dependencias externas
vi.mock('@/components/ui/SOSButton', () => ({
  SOSButton: () => null,
}))

// Handler para attendance/today — devuelve null (sin registro)
function makeAttendanceTodayHandler() {
  return http.get(`${API}/attendance/today`, () =>
    HttpResponse.json({ success: true, data: null })
  )
}

// Handler para form-templates — devuelve los fixtures
function makeTemplatesHandler() {
  return http.get(`${API}/form-templates`, () =>
    HttpResponse.json({ success: true, data: formTemplateFixtures })
  )
}

// Helper — fuerza lite_mode para que no muestre StoryIntro ni redirija a /game/world-map
function setLiteMode() {
  sessionStorage.setItem('lite_mode', 'true')
}

function clearLiteMode() {
  sessionStorage.removeItem('lite_mode')
}

function markIntroAsShown() {
  const todayKey = new Date().toISOString().slice(0, 10)
  localStorage.setItem(`intro_shown_${todayKey}`, '1')
}

describe('OperatorHomePage', () => {
  beforeEach(() => {
    setLiteMode()
    markIntroAsShown()
    useAuthStore.getState().setToken(tokens.OPERATOR)
    server.use(makeAttendanceTodayHandler(), makeTemplatesHandler())
  })

  afterEach(() => {
    clearLiteMode()
    localStorage.clear()
    clearAuthStore()
  })

  it('should show operator job title or identifier in the page', async () => {
    // Arrange & Act
    renderWithProviders(<OperatorHomePage />, {
      user: { token: tokens.OPERATOR },
    })

    // Assert — el jobTitle del JWT del operario ("Operador de campo") aparece en pantalla
    await waitFor(() => {
      expect(screen.getByText(/operador de campo/i)).toBeInTheDocument()
    })
  })

  it('should load and display the list of form templates from the API', async () => {
    // Arrange & Act
    renderWithProviders(<OperatorHomePage />, {
      user: { token: tokens.OPERATOR },
    })

    // Assert — el nombre del primer template del fixture aparece
    await waitFor(() => {
      expect(screen.getByText(formTemplateFixtures[0].name)).toBeInTheDocument()
    })
  })

  it('should show loading spinner while templates are loading', async () => {
    // Arrange — handler que nunca resuelve para mantener el estado loading
    let resolveTemplates: () => void
    server.use(
      http.get(`${API}/form-templates`, () =>
        new Promise<never>((resolve) => {
          resolveTemplates = resolve as () => void
        })
      )
    )

    // Act
    renderWithProviders(<OperatorHomePage />, {
      user: { token: tokens.OPERATOR },
    })

    // Assert — spinner visible mientras carga
    await waitFor(() => {
      expect(screen.getByLabelText(/cargando formularios/i)).toBeInTheDocument()
    })

    // Cleanup — resolver la petición para no dejar promesas colgadas
    resolveTemplates!()
  })

  it('should show error state when templates API returns 500', async () => {
    // Arrange
    server.use(
      http.get(`${API}/form-templates`, () =>
        new HttpResponse(null, { status: 500 })
      )
    )

    // Act
    renderWithProviders(<OperatorHomePage />, {
      user: { token: tokens.OPERATOR },
    })

    // Assert — mensaje de error visible
    await waitFor(() => {
      expect(
        screen.getByText(/no se pudieron cargar los formularios/i)
      ).toBeInTheDocument()
    })
  })
})
