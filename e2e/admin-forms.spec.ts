import { test, expect } from '@playwright/test'

// ── JWT mock ──────────────────────────────────────────────────────────────────

function buildMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const body   = btoa(JSON.stringify(payload)).replace(/=/g, '')
  return `${header}.${body}.mock-signature`
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600

const ADMIN_JWT = buildMockJwt({
  sub:      'admin-user-001',
  orgId:    'org-test-001',
  role:     'ADMIN',
  jobTitle: 'Admin Test',
  iat:      Math.floor(Date.now() / 1000),
  exp:      FUTURE_EXP,
})

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TEMPLATES = [
  {
    id:             'tpl-001',
    name:           'Inspección de seguridad',
    description:    'Formulario de inspección semanal',
    status:         'ACTIVE',
    data_frequency: 'WEEKLY',
    icon:           '🛡️',
    created_at:     '2024-01-15T10:00:00Z',
    fields:         [],
  },
  {
    id:             'tpl-002',
    name:           'Control de calidad',
    description:    null,
    status:         'DRAFT',
    data_frequency: 'DAILY',
    icon:           '✅',
    created_at:     '2024-02-01T09:00:00Z',
    fields:         [],
  },
  {
    id:             'tpl-003',
    name:           'Reporte mensual',
    description:    'Reporte de actividades del mes',
    status:         'ARCHIVED',
    data_frequency: 'MONTHLY',
    icon:           '📊',
    created_at:     '2023-12-01T08:00:00Z',
    fields:         [],
  },
]

const MOCK_STATS = {
  total_submissions: 128,
  by_status:         { APPROVED: 95, SUBMITTED: 20, REJECTED: 8, DRAFT: 5 },
  trend:             [
    { month: 'Ene', submissions: 10 },
    { month: 'Feb', submissions: 22 },
    { month: 'Mar', submissions: 31 },
  ],
  recent: [
    {
      id:            'sub-001',
      submitted_by:  'Juan Pérez',
      template_name: 'Inspección de seguridad',
      work_location: 'Sede Norte',
      submitted_at:  '2024-03-15T14:30:00Z',
      status:        'APPROVED',
    },
  ],
}

// ── Helper: inyectar sesión de admin ──────────────────────────────────────────

async function injectAdminSession(page: import('@playwright/test').Page) {
  await page.addInitScript((token: string) => {
    const payload = JSON.parse(atob(token.split('.')[1]))
    localStorage.setItem('senal-auth', JSON.stringify({
      state:   { token, user: payload, workLocationId: null },
      version: 0,
    }))
  }, ADMIN_JWT)
}

// ── Interceptores de API comunes ──────────────────────────────────────────────

async function mockAdminApis(page: import('@playwright/test').Page) {
  await page.route('**/form-templates/admin**', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify(MOCK_TEMPLATES),
    })
  })

  await page.route('**/form-submissions/stats**', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify(MOCK_STATS),
    })
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Panel de administrador — Formularios', () => {

  test('navegar a /admin como ADMIN carga el dashboard sin errores', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin')

    // El heading principal del dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 8000 })

    // No debe mostrar el mensaje de error
    await expect(page.getByText(/error al cargar el dashboard/i)).not.toBeVisible()
  })

  test('el dashboard muestra las stat cards con datos', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 8000 })

    // Las StatCards deben mostrar los valores del mock
    await expect(page.getByText('128')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('95')).toBeVisible({ timeout: 5000 })
  })

  test('el dashboard muestra la actividad reciente', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 8000 })

    // La tabla de actividad reciente debe mostrar el usuario del mock
    await expect(page.getByText('Juan Pérez')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Inspección de seguridad')).toBeVisible({ timeout: 5000 })
  })

  test('navegar a /admin/formularios carga la lista de plantillas', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin/formularios')

    // El heading de la página de formularios
    await expect(page.getByRole('heading', { name: /formularios/i })).toBeVisible({ timeout: 8000 })
  })

  test('la lista de formularios muestra el contador correcto', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin/formularios')

    await expect(page.getByRole('heading', { name: /formularios/i })).toBeVisible({ timeout: 8000 })

    // El subtítulo dice "3 formularios en total" (coincide con MOCK_TEMPLATES.length)
    await expect(page.getByText(/3 formularios en total/i)).toBeVisible({ timeout: 5000 })
  })

  test('la lista de formularios muestra las plantillas del mock', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin/formularios')

    await expect(page.getByRole('heading', { name: /formularios/i })).toBeVisible({ timeout: 8000 })

    await expect(page.getByText('Inspección de seguridad')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Control de calidad')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Reporte mensual')).toBeVisible({ timeout: 5000 })
  })

  test('la lista de formularios tiene el botón "Crear formulario"', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin/formularios')

    await expect(page.getByRole('heading', { name: /formularios/i })).toBeVisible({ timeout: 8000 })

    await expect(
      page.getByRole('button', { name: /crear formulario/i })
    ).toBeVisible({ timeout: 5000 })
  })

  test('la lista de formularios muestra estado vacío cuando no hay plantillas', async ({ page }) => {
    await injectAdminSession(page)

    // Sobreescribir: lista vacía
    await page.route('**/form-templates/admin**', async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify([]),
      })
    })

    await page.goto('/admin/formularios')

    await expect(page.getByRole('heading', { name: /formularios/i })).toBeVisible({ timeout: 8000 })

    // Mensaje de estado vacío
    await expect(page.getByText(/no hay formularios/i)).toBeVisible({ timeout: 5000 })
  })

  test('la tabla de formularios muestra las columnas de encabezado', async ({ page }) => {
    await injectAdminSession(page)
    await mockAdminApis(page)

    await page.goto('/admin/formularios')

    await expect(page.getByRole('heading', { name: /formularios/i })).toBeVisible({ timeout: 8000 })

    // Verificar headers de la tabla
    await expect(page.getByRole('columnheader', { name: /nombre/i })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('columnheader', { name: /estado/i })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('columnheader', { name: /frecuencia/i })).toBeVisible({ timeout: 5000 })
  })

  test('un usuario no autenticado que navega a /admin es redirigido a /login', async ({ page }) => {
    // Sin inyectar sesión → RoleGuard redirige
    await page.goto('/admin')
    await page.waitForURL(/\/login/, { timeout: 8000 })
    expect(page.url()).toContain('/login')
  })

  test('un OPERATOR que intenta acceder a /admin es redirigido a /', async ({ page }) => {
    const OPERATOR_JWT = buildMockJwt({
      sub:      'op-user-001',
      orgId:    'org-test-001',
      role:     'OPERATOR',
      jobTitle: 'Operario Test',
      iat:      Math.floor(Date.now() / 1000),
      exp:      FUTURE_EXP,
    })

    await page.addInitScript((token: string) => {
      const payload = JSON.parse(atob(token.split('.')[1]))
      localStorage.setItem('senal-auth', JSON.stringify({
        state:   { token, user: payload, workLocationId: 'loc-001' },
        version: 0,
      }))
      sessionStorage.setItem('lite_mode', 'true')
    }, OPERATOR_JWT)

    // Interceptar APIs del operario para que no falle al redirigir
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

    await page.goto('/admin')

    // RoleGuard redirige al OPERATOR a su ruta home
    await page.waitForURL(/^http:\/\/localhost:\d+\/$/, { timeout: 8000 })
    expect(new URL(page.url()).pathname).toBe('/')
  })
})
