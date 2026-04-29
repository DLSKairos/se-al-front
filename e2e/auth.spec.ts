import { test, expect } from '@playwright/test'

// ── JWT mock helpers ──────────────────────────────────────────────────────────

/**
 * Construye un JWT con payload válido para las pruebas.
 * El token NO está firmado con una clave real, pero la app solo decodifica
 * el payload (base64) sin verificar la firma — suficiente para E2E.
 */
function buildMockJwt(payload: Record<string, unknown>): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const body    = btoa(JSON.stringify(payload)).replace(/=/g, '')
  const sig     = 'mock-signature'
  return `${header}.${body}.${sig}`
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600 // 1 hora desde ahora

const OPERATOR_JWT = buildMockJwt({
  sub:      'op-user-001',
  orgId:    'org-test-001',
  role:     'OPERATOR',
  jobTitle: 'Operario Test',
  iat:      Math.floor(Date.now() / 1000),
  exp:      FUTURE_EXP,
})

const ADMIN_JWT = buildMockJwt({
  sub:      'admin-user-001',
  orgId:    'org-test-001',
  role:     'ADMIN',
  jobTitle: 'Administrador Test',
  iat:      Math.floor(Date.now() / 1000),
  exp:      FUTURE_EXP,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Autenticación — LoginPage', () => {

  test('login exitoso como OPERATOR redirige a /location-select', async ({ page }) => {
    // Interceptar: verificar que el usuario existe (tiene PIN configurado)
    await page.route('**/auth/pin/status', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ pinEnabled: true, pinConfigured: true }),
      })
    })

    // Interceptar: verificar PIN y devolver token de OPERATOR
    await page.route('**/auth/pin/verify', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ access_token: OPERATOR_JWT }),
      })
    })

    // Interceptar: la página de selección de sede para que no cuelgue
    await page.route('**/work-locations**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    await page.goto('/login')

    // El SplashScreen debe terminar; esperar el formulario de cédula
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 8000 })

    // Ingresar cédula y continuar
    await page.locator('#cedula-input').fill('1020304050')
    await page.locator('[data-testid="login-submit"]').click()

    // Esperar el paso de PIN (pinConfigured = true)
    await expect(page.getByText('Ingresa tu PIN')).toBeVisible({ timeout: 5000 })

    // Ingresar 4 dígitos usando el teclado numérico
    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit }).click()
    }

    // Pulsar "Entrar"
    await page.getByRole('button', { name: /entrar/i }).click()

    // OPERATOR → redirectByRole → /location-select
    await page.waitForURL(/\/location-select/, { timeout: 8000 })
    expect(page.url()).toContain('/location-select')
  })

  test('login exitoso como ADMIN redirige a /admin', async ({ page }) => {
    await page.route('**/auth/pin/status', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ pinEnabled: true, pinConfigured: true }),
      })
    })

    await page.route('**/auth/pin/verify', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ access_token: ADMIN_JWT }),
      })
    })

    // Interceptar peticiones del dashboard para que no fallen
    await page.route('**/form-submissions/stats**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({
          total_submissions: 0,
          by_status:         { APPROVED: 0, SUBMITTED: 0, REJECTED: 0, DRAFT: 0 },
          trend:             [],
          recent:            [],
        }),
      })
    })

    await page.route('**/form-templates/admin**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    await page.goto('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 8000 })

    await page.locator('#cedula-input').fill('9876543210')
    await page.locator('[data-testid="login-submit"]').click()

    await expect(page.getByText('Ingresa tu PIN')).toBeVisible({ timeout: 5000 })

    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit }).click()
    }

    await page.getByRole('button', { name: /entrar/i }).click()

    // ADMIN → redirectByRole → /admin
    await page.waitForURL(/\/admin/, { timeout: 8000 })
    expect(page.url()).toContain('/admin')
  })

  test('login fallido con PIN incorrecto muestra mensaje de error', async ({ page }) => {
    await page.route('**/auth/pin/status', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ pinEnabled: true, pinConfigured: true }),
      })
    })

    // Responder con 401 para simular PIN incorrecto
    await page.route('**/auth/pin/verify', async (route) => {
      await route.fulfill({
        status:      401,
        contentType: 'application/json',
        body:        JSON.stringify({ message: 'PIN incorrecto' }),
      })
    })

    await page.goto('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 8000 })

    await page.locator('#cedula-input').fill('1020304050')
    await page.locator('[data-testid="login-submit"]').click()

    await expect(page.getByText('Ingresa tu PIN')).toBeVisible({ timeout: 5000 })

    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit }).click()
    }

    await page.getByRole('button', { name: /entrar/i }).click()

    // El componente muestra [data-testid="login-error"] cuando verifyPin.isError
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="login-error"]')).toHaveText('PIN incorrecto')

    // La URL no debe haber cambiado
    expect(page.url()).toContain('/login')
  })

  test('cédula no encontrada muestra error y permanece en /login', async ({ page }) => {
    // Responder 404 en status para simular cédula inexistente
    await page.route('**/auth/pin/status', async (route) => {
      await route.fulfill({
        status:      404,
        contentType: 'application/json',
        body:        JSON.stringify({ message: 'Usuario no encontrado' }),
      })
    })

    await page.goto('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 8000 })

    await page.locator('#cedula-input').fill('0000000000')
    await page.locator('[data-testid="login-submit"]').click()

    // La app muestra toast de error y vuelve al paso 'cedula'
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('logout desde perfil de operario redirige a /login', async ({ page }) => {
    // Pre-autenticar como OPERATOR inyectando token en localStorage
    await page.addInitScript((token: string) => {
      const payload = JSON.parse(atob(token.split('.')[1]))
      localStorage.setItem('senal-auth', JSON.stringify({
        state:   { token, user: payload, workLocationId: 'loc-001' },
        version: 0,
      }))
      sessionStorage.setItem('lite_mode', 'true')
    }, OPERATOR_JWT)

    // Interceptar APIs que carga OperatorHomePage
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

    // Interceptar APIs del perfil
    await page.route('**/users/**/webauthn/credentials', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    // Hacer clic en "Cerrar sesión"
    const logoutBtn = page.getByRole('button', { name: /cerrar sesión/i })
    await expect(logoutBtn).toBeVisible({ timeout: 5000 })
    await logoutBtn.click()

    // Debe redirigir a /login
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})
