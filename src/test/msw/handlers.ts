import { http, HttpResponse } from 'msw'
import { loginResponses } from './fixtures/auth.fixtures'
import { formTemplateFixtures } from './fixtures/formTemplates.fixtures'
import { userFixtures } from './fixtures/users.fixtures'
import { dashboardStatsFixture } from './fixtures/dashboard.fixtures'
import type { AttendanceConfig, AttendanceRecord, WebhookEndpoint, Department, WorkLocation, FormCategory, FormSubmission, FormBlueprint } from '@/types'

const BASE = '/api'

const ok = <T>(data: T) => HttpResponse.json({ success: true, data })

// ── Fixtures inline para entidades secundarias ─────────────────────────────

const attendanceConfigFixture: AttendanceConfig = {
  id: 'config-001',
  org_id: 'org-test-001',
  is_enabled: true,
  standard_daily_hours: 8,
  night_shift_start: '22:00',
  night_shift_end: '06:00',
  sunday_surcharge: true,
  holiday_surcharge: true,
  custom_holidays: ['2024-12-25', '2024-01-01'],
}

const attendanceRecordFixtures: AttendanceRecord[] = [
  {
    id: 'att-001',
    org_id: 'org-test-001',
    user_id: 'user-operator-001',
    work_location_id: 'loc-001',
    service_date: '2024-05-15',
    entry_time: '07:00',
    exit_time: '16:00',
    lunch_minutes: 60,
    total_minutes: 480,
    regular_minutes: 480,
    extra_day_minutes: 0,
    extra_night_minutes: 0,
    extra_sunday_minutes: 0,
    extra_holiday_minutes: 0,
    user: { name: 'Carlos Mendoza' },
    work_location: { name: 'Planta Norte' },
  },
]

const webhookFixtures: WebhookEndpoint[] = [
  {
    id: 'webhook-001',
    org_id: 'org-test-001',
    url: 'https://example.com/webhook',
    secret: 'secret-abc123',
    event_types: ['form.submitted', 'form.approved'],
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
]

const departmentFixtures: Department[] = [
  { id: 'dept-001', org_id: 'org-test-001', name: 'Operaciones', email: 'ops@empresa.com' },
  { id: 'dept-002', org_id: 'org-test-001', name: 'SST', email: 'sst@empresa.com' },
]

const workLocationFixtures: WorkLocation[] = [
  {
    id: 'loc-001',
    org_id: 'org-test-001',
    department_id: 'dept-001',
    name: 'Planta Norte',
    contractor: 'Contratista A',
    lat: 4.711,
    lng: -74.0721,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'loc-002',
    org_id: 'org-test-001',
    department_id: 'dept-001',
    name: 'Planta Sur',
    contractor: 'Contratista B',
    lat: 4.6,
    lng: -74.1,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
]

const formCategoryFixtures: FormCategory[] = [
  { id: 'cat-001', org_id: 'org-test-001', name: 'Seguridad', is_sst: true, created_at: '2024-01-01T00:00:00.000Z' },
  { id: 'cat-002', org_id: 'org-test-001', name: 'Permisos', is_sst: false, created_at: '2024-01-01T00:00:00.000Z' },
]

const submissionFixtures: FormSubmission[] = [
  {
    id: 'sub-001',
    template_id: 'template-001',
    org_id: 'org-test-001',
    submitted_by: 'user-operator-001',
    work_location_id: 'loc-001',
    submitted_at: '2024-05-15T09:30:00.000Z',
    status: 'SUBMITTED',
    period_key: '2024-05-15',
    data: { estado_equipo: 'bueno' },
    geo_lat: 4.711,
    geo_lng: -74.0721,
    template: { name: 'Inspección de Equipos' },
    submitter: { name: 'Carlos Mendoza' },
    work_location: { name: 'Planta Norte' },
  },
]

const blueprintFixtures: FormBlueprint[] = [
  {
    id: 'blueprint-001',
    name: 'Inspección de EPP',
    description: 'Plantilla base para inspección de elementos de protección personal',
    category: 'Seguridad',
    is_global: true,
    org_id: null,
    fields: [],
    created_at: '2024-01-01T00:00:00.000Z',
  },
]

// ── Handlers ───────────────────────────────────────────────────────────────

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { identification_number?: string; pin?: string }
    // Devuelve token ADMIN por defecto; en tests específicos se puede usar server.use() para sobreescribir
    const role = (body as Record<string, string>).role ?? 'ADMIN'
    const response = loginResponses[role as keyof typeof loginResponses] ?? loginResponses.ADMIN
    return ok(response)
  }),

  http.post(`${BASE}/auth/webauthn/register`, async () => {
    return ok({ options: { challenge: 'test-challenge', rp: { name: 'SEÑAL' } } })
  }),

  http.post(`${BASE}/auth/webauthn/authenticate`, async () => {
    return ok(loginResponses.OPERATOR)
  }),

  // ── Form Templates ────────────────────────────────────────────────────────
  http.get(`${BASE}/form-templates`, () => ok(formTemplateFixtures)),

  http.post(`${BASE}/form-templates`, async ({ request }) => {
    const body = await request.json() as Partial<typeof formTemplateFixtures[0]>
    const newTemplate = {
      ...formTemplateFixtures[0],
      ...body,
      id: `template-new-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return ok(newTemplate)
  }),

  http.get(`${BASE}/form-templates/:id`, ({ params }) => {
    const template = formTemplateFixtures.find(t => t.id === params.id)
    if (!template) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok(template)
  }),

  http.put(`${BASE}/form-templates/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<typeof formTemplateFixtures[0]>
    const template = formTemplateFixtures.find(t => t.id === params.id)
    if (!template) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok({ ...template, ...body, updated_at: new Date().toISOString() })
  }),

  http.delete(`${BASE}/form-templates/:id`, ({ params }) => {
    const exists = formTemplateFixtures.some(t => t.id === params.id)
    if (!exists) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok({ id: params.id })
  }),

  // ── Form Submissions ──────────────────────────────────────────────────────
  http.get(`${BASE}/form-submissions`, () => ok(submissionFixtures)),

  http.post(`${BASE}/form-submissions`, async ({ request }) => {
    const body = await request.json() as Partial<typeof submissionFixtures[0]>
    const newSub = {
      ...submissionFixtures[0],
      ...body,
      id: `sub-new-${Date.now()}`,
      submitted_at: new Date().toISOString(),
    }
    return ok(newSub)
  }),

  http.get(`${BASE}/form-submissions/:id`, ({ params }) => {
    const sub = submissionFixtures.find(s => s.id === params.id)
    if (!sub) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok(sub)
  }),

  // ── Users ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/users`, () => ok(userFixtures)),

  http.post(`${BASE}/users`, async ({ request }) => {
    const body = await request.json() as Partial<typeof userFixtures[0]>
    const newUser = {
      ...userFixtures[0],
      ...body,
      id: `user-new-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    return ok(newUser)
  }),

  http.put(`${BASE}/users/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<typeof userFixtures[0]>
    const user = userFixtures.find(u => u.id === params.id)
    if (!user) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok({ ...user, ...body })
  }),

  http.delete(`${BASE}/users/:id`, ({ params }) => {
    const exists = userFixtures.some(u => u.id === params.id)
    if (!exists) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok({ id: params.id })
  }),

  // ── Org ───────────────────────────────────────────────────────────────────
  http.get(`${BASE}/departments`, () => ok(departmentFixtures)),
  http.get(`${BASE}/work-locations`, () => ok(workLocationFixtures)),
  http.get(`${BASE}/form-categories`, () => ok(formCategoryFixtures)),

  // ── Webhooks ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/webhooks`, () => ok(webhookFixtures)),

  http.post(`${BASE}/webhooks`, async ({ request }) => {
    const body = await request.json() as Partial<typeof webhookFixtures[0]>
    const newWebhook = {
      ...webhookFixtures[0],
      ...body,
      id: `webhook-new-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    return ok(newWebhook)
  }),

  http.delete(`${BASE}/webhooks/:id`, ({ params }) => {
    const exists = webhookFixtures.some(w => w.id === params.id)
    if (!exists) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok({ id: params.id })
  }),

  // ── Attendance ────────────────────────────────────────────────────────────
  http.get(`${BASE}/attendance`, () => ok(attendanceRecordFixtures)),

  http.post(`${BASE}/attendance`, async ({ request }) => {
    const body = await request.json() as Partial<typeof attendanceRecordFixtures[0]>
    const newRecord = {
      ...attendanceRecordFixtures[0],
      ...body,
      id: `att-new-${Date.now()}`,
    }
    return ok(newRecord)
  }),

  http.get(`${BASE}/attendance/config`, () => ok(attendanceConfigFixture)),

  http.put(`${BASE}/attendance/config`, async ({ request }) => {
    const body = await request.json() as Partial<typeof attendanceConfigFixture>
    return ok({ ...attendanceConfigFixture, ...body })
  }),

  // ── AI ────────────────────────────────────────────────────────────────────
  http.post(`${BASE}/form-ai/extract-from-file`, () =>
    ok({
      fields: [],
      source_filename: 'test-document.pdf',
      source_file_url: 'https://storage.example.com/test-document.pdf',
    })
  ),

  http.post(`${BASE}/form-ai/generate-from-description`, () =>
    ok({
      name: 'Formulario generado por IA',
      sections: [
        {
          id: 'section-ai-001',
          name: 'Sección principal',
          hasObservations: true,
          fields: [],
        },
      ],
    })
  ),

  http.post(`${BASE}/form-ai/assist`, () =>
    ok({
      action: 'none' as const,
      payload: null,
      message: 'No se requieren cambios',
    })
  ),

  // ── Blueprints ────────────────────────────────────────────────────────────
  http.get(`${BASE}/form-blueprints`, () => ok(blueprintFixtures)),

  http.post(`${BASE}/form-blueprints/:id/use`, ({ params }) => {
    const blueprint = blueprintFixtures.find(b => b.id === params.id)
    if (!blueprint) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return ok({
      ...formTemplateFixtures[0],
      id: `template-from-blueprint-${Date.now()}`,
      name: blueprint.name,
    })
  }),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/dashboard/stats`, () => ok(dashboardStatsFixture)),

  // ── Push ──────────────────────────────────────────────────────────────────
  http.post(`${BASE}/push/subscribe`, () => ok({ subscribed: true })),
]
