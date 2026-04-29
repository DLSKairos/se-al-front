import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../msw/server'
import { renderWithProviders, clearAuthStore } from '../utils/renderWithProviders'
import { tokens } from '../msw/fixtures/auth.fixtures'
import { dashboardStatsFixture } from '../msw/fixtures/dashboard.fixtures'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'

// El AdminDashboardPage llama a /form-submissions/stats y /form-templates/admin
// Ambos endpoints no están en los handlers base, se definen aquí.
// La URL base en tests viene de VITE_API_URL en .env.local → https://localhost:3000/api
const API = 'https://localhost:3000/api'

const submissionStatsHandler = http.get(`${API}/form-submissions/stats`, () =>
  HttpResponse.json({ success: true, data: dashboardStatsFixture })
)

const templatesAdminHandler = http.get(`${API}/form-templates/admin`, () =>
  HttpResponse.json({ success: true, data: [] })
)

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setToken(tokens.ADMIN)
    server.use(submissionStatsHandler, templatesAdminHandler)
  })

  afterEach(() => {
    clearAuthStore()
  })

  it('should show stat cards with values from the API', async () => {
    // Arrange & Act
    renderWithProviders(<AdminDashboardPage />, {
      user: { token: tokens.ADMIN },
    })

    // Assert — los valores del fixture aparecen en las cards
    await waitFor(() => {
      expect(
        screen.getByText(String(dashboardStatsFixture.total_submissions))
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(String(dashboardStatsFixture.by_status.APPROVED))
    ).toBeInTheDocument()

    expect(
      screen.getByText(String(dashboardStatsFixture.by_status.SUBMITTED))
    ).toBeInTheDocument()

    expect(
      screen.getByText(String(dashboardStatsFixture.by_status.REJECTED))
    ).toBeInTheDocument()
  })

  it('should show loading spinner while stats are loading', async () => {
    // Arrange — handler que no resuelve inmediatamente
    let resolveStats: () => void
    const slowHandler = http.get(`${API}/form-submissions/stats`, () =>
      new Promise<never>((resolve) => {
        resolveStats = resolve as () => void
      })
    )
    server.use(slowHandler)

    // Act
    renderWithProviders(<AdminDashboardPage />, {
      user: { token: tokens.ADMIN },
    })

    // Assert — spinner visible
    await waitFor(() => {
      expect(screen.getByLabelText(/cargando estadísticas/i)).toBeInTheDocument()
    })

    // Cleanup
    resolveStats!()
  })

  it('should show error state when stats API returns 500', async () => {
    // Arrange
    server.use(
      http.get(`${API}/form-submissions/stats`, () =>
        new HttpResponse(null, { status: 500 })
      )
    )

    // Act
    renderWithProviders(<AdminDashboardPage />, {
      user: { token: tokens.ADMIN },
    })

    // Assert — mensaje de error visible
    await waitFor(() => {
      expect(
        screen.getByText(/error al cargar el dashboard/i)
      ).toBeInTheDocument()
    })
  })
})

import { useAuthStore } from '@/stores/authStore'
