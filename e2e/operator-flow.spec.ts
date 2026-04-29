import { test, expect } from '@playwright/test'

// ── JWT mock ──────────────────────────────────────────────────────────────────

function buildMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const body   = btoa(JSON.stringify(payload)).replace(/=/g, '')
  return `${header}.${body}.mock-signature`
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600

const OPERATOR_JWT = buildMockJwt({
  sub:      'op-user-001',
  orgId:    'org-test-001',
  role:     'OPERATOR',
  jobTitle: 'Carlos Test',
  iat:      Math.floor(Date.now() / 1000),
  exp:      FUTURE_EXP,
})

// ── Helper: inyectar sesión de operario ───────────────────────────────────────

/**
 * Inyecta el JWT en localStorage con la estructura que usa Zustand persist,
 * y activa `lite_mode` en sessionStorage para que OperatorHomePage
 * muestre el dashboard en lugar de redirigir al WorldMap.
 */
async function injectOperatorSession(page: import('@playwright/test').Page) {
  await page.addInitScript((token: string) => {
    const payload = JSON.parse(atob(token.split('.')[1]))
    localStorage.setItem('senal-auth', JSON.stringify({
      state:   { token, user: payload, workLocationId: 'loc-test-001' },
      version: 0,
    }))
    // Necesario para que OperatorHomePage no redirija a /game/world-map
    sessionStorage.setItem('lite_mode', 'true')
  }, OPERATOR_JWT)
}

// ── Interceptores de API comunes ──────────────────────────────────────────────

async function mockOperatorApis(page: import('@playwright/test').Page) {
  await page.route('**/form-templates**', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify([
        {
          id:             'tpl-001',
          name:           'Inspección diaria',
          description:    'Formulario de inspección de equipos',
          status:         'ACTIVE',
          data_frequency: 'DAILY',
          icon:           '🔧',
          created_at:     '2024-01-15T10:00:00Z',
          fields:         [],
        },
        {
          id:             'tpl-002',
          name:           'Reporte de incidente',
          description:    null,
          status:         'ACTIVE',
          data_frequency: 'PER_EVENT',
          icon:           '⚠️',
          created_at:     '2024-01-10T08:00:00Z',
          fields:         [],
        },
      ]),
    })
  })

  await page.route('**/attendance/today**', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify(null),
    })
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Flujo del operario', () => {

  test('navegar a / como OPERATOR muestra el home del operario', async ({ page }) => {
    await injectOperatorSession(page)
    await mockOperatorApis(page)

    await page.goto('/')

    // El home del operario tiene el encabezado con el nombre
    await expect(page.getByText(/Hola/i)).toBeVisible({ timeout: 8000 })

    // La URL debe ser /
    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('el home del operario muestra la sección de formularios disponibles', async ({ page }) => {
    await injectOperatorSession(page)
    await mockOperatorApis(page)

    await page.goto('/')

    // Sección "Mis formularios"
    await expect(page.getByText(/mis formularios/i)).toBeVisible({ timeout: 8000 })

    // Al menos uno de los formularios mock debe ser visible
    await expect(page.getByText('Inspección diaria')).toBeVisible({ timeout: 5000 })
  })

  test('el home muestra estado vacío cuando no hay formularios asignados', async ({ page }) => {
    await injectOperatorSession(page)

    // Sobreescribir: sin formularios
    await page.route('**/form-templates**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    await page.route('**/attendance/today**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify(null),
      })
    })

    await page.goto('/')

    await expect(
      page.getByText(/no tienes formularios asignados/i)
    ).toBeVisible({ timeout: 8000 })
  })

  test('el home muestra el card de asistencia pendiente', async ({ page }) => {
    await injectOperatorSession(page)
    await mockOperatorApis(page)

    await page.goto('/')

    // Cuando attendance es null, se muestra "Sin registro de entrada"
    await expect(page.getByText(/sin registro de entrada/i)).toBeVisible({ timeout: 8000 })
  })

  test('navegar a /perfil muestra los datos del operario', async ({ page }) => {
    await injectOperatorSession(page)

    // APIs necesarias para OperatorProfilePage
    await page.route('**/users/**/webauthn/credentials', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    // APIs que puede cargar el layout (por si hay NavBar con datos)
    await page.route('**/form-templates**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    await page.route('**/attendance/today**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify(null),
      })
    })

    await page.goto('/perfil')

    // El heading "Mi perfil" debe ser visible
    await expect(page.getByRole('heading', { name: /mi perfil/i })).toBeVisible({ timeout: 8000 })

    // El nombre del operario (jobTitle del JWT) debe aparecer
    await expect(page.getByText('Carlos Test')).toBeVisible({ timeout: 5000 })
  })

  test('navegar a /perfil muestra sección de información personal', async ({ page }) => {
    await injectOperatorSession(page)

    await page.route('**/users/**/webauthn/credentials', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    await page.route('**/form-templates**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    await page.route('**/attendance/today**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify(null),
      })
    })

    await page.goto('/perfil')

    // La sección de información personal tiene el label "Información"
    await expect(page.getByText(/información/i).first()).toBeVisible({ timeout: 8000 })

    // El botón de cerrar sesión debe estar visible
    await expect(page.getByRole('button', { name: /cerrar sesión/i })).toBeVisible({ timeout: 5000 })
  })

  test('un usuario no autenticado que navega a / es redirigido a /login', async ({ page }) => {
    // Sin inyectar sesión → el RoleGuard debe redirigir
    await page.goto('/')
    await page.waitForURL(/\/login/, { timeout: 8000 })
    expect(page.url()).toContain('/login')
  })
})
