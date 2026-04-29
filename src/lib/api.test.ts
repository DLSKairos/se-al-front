import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import api, { formAiApi, blueprintsApi, registerTokenHelpers } from '@/lib/api'
import { tokens } from '@/test/msw/fixtures/auth.fixtures'

// Vitest carga .env.local → VITE_API_URL=https://localhost:3000/api
const BASE = 'https://localhost:3000/api'

// MSW (@mswjs/interceptors) necesita que window.location tenga un origen
// válido para poder procesar URLs absolutas con https:// en jsdom.
// Sin esto falla con ERR_INVALID_URL / base: '/'.
beforeAll(() => {
  Object.defineProperty(window, 'location', {
    value: new URL('https://localhost:3000'),
    writable: true,
    configurable: true,
  })
})

// ── Token controlado en los tests ─────────────────────────────────────────────
// Registramos nuestros propios helpers para controlar el token sin depender
// del authStore (que también llama a registerTokenHelpers al importarse).
let _testToken: string | null = null

function installTestHelpers() {
  registerTokenHelpers(
    () => _testToken,
    () => {
      _testToken = null
    }
  )
}

beforeEach(() => {
  _testToken = null
  installTestHelpers()
})

// ── Interceptor de request ────────────────────────────────────────────────────

describe('interceptor de request', () => {
  it('incluye el header Authorization cuando hay token', async () => {
    _testToken = tokens.ADMIN
    let capturedAuth: string | null = null

    server.use(
      http.get(`${BASE}/form-templates`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    await api.get('/form-templates')

    expect(capturedAuth).toBe(`Bearer ${tokens.ADMIN}`)
  })

  it('NO incluye el header Authorization cuando no hay token', async () => {
    _testToken = null
    let capturedAuth: string | null | undefined = undefined

    server.use(
      http.get(`${BASE}/form-templates`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    await api.get('/form-templates')

    expect(capturedAuth).toBeNull()
  })
})

// ── Interceptor de response — unwrap ──────────────────────────────────────────

describe('interceptor de response — unwrap', () => {
  it('desempaqueta {success: true, data: X} y devuelve solo X al cliente', async () => {
    const payload = { id: 1, name: 'test' }

    server.use(
      http.get(`${BASE}/test-unwrap`, () =>
        HttpResponse.json({ success: true, data: payload })
      )
    )

    const response = await api.get('/test-unwrap')

    expect(response.data).toEqual(payload)
  })

  it('retorna la respuesta directa (sin unwrap) cuando responseType es blob', async () => {
    server.use(
      http.get(`${BASE}/test-blob`, () =>
        new HttpResponse('contenido binario', {
          headers: { 'Content-Type': 'application/octet-stream' },
        })
      )
    )

    const response = await api.get('/test-blob', { responseType: 'blob' })

    // El interceptor detecta responseType === 'blob' y retorna la respuesta sin unwrap
    expect(response.config.responseType).toBe('blob')
  })
})

// ── Interceptor de response — errores ─────────────────────────────────────────

describe('interceptor de response — errores', () => {
  it('llama clearToken cuando la respuesta es 401 (token queda null)', async () => {
    _testToken = tokens.ADMIN
    // Asegurar que nuestros helpers están activos justo antes del test
    installTestHelpers()

    server.use(
      http.get(`${BASE}/test-401`, () =>
        HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      )
    )

    await expect(api.get('/test-401')).rejects.toThrow()

    expect(_testToken).toBeNull()
  })

  it('redirige a /login cuando la respuesta es 401', async () => {
    _testToken = tokens.ADMIN
    installTestHelpers()

    // Espiamos la propiedad href sin destruir el objeto location
    const locationSpy = vi.spyOn(window.location, 'href', 'set')

    server.use(
      http.get(`${BASE}/test-401-redirect`, () =>
        HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      )
    )

    await expect(api.get('/test-401-redirect')).rejects.toThrow()

    expect(locationSpy).toHaveBeenCalledWith('/login')
    locationSpy.mockRestore()
  })

  it('propaga el error cuando la respuesta es 500', async () => {
    server.use(
      http.get(`${BASE}/test-500`, () =>
        HttpResponse.json(
          { success: false, message: 'Internal Server Error' },
          { status: 500 }
        )
      )
    )

    await expect(api.get('/test-500')).rejects.toMatchObject({
      response: { status: 500 },
    })
  })
})

// ── formAiApi ─────────────────────────────────────────────────────────────────

describe('formAiApi', () => {
  it('generateFromDescription hace POST a /form-ai/generate-from-description con los parámetros correctos', async () => {
    const dto = {
      description: 'Formulario de inspección de equipos de altura',
      columns: 2 as const,
      observationsPerSection: true,
    }
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/form-ai/generate-from-description`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { name: 'Formulario generado', sections: [] },
        })
      })
    )

    await formAiApi.generateFromDescription(dto)

    expect(capturedBody).toEqual(dto)
  })

  it('assist hace POST a /form-ai/assist con los parámetros correctos', async () => {
    const dto = {
      message: 'Agrega una sección de seguridad',
      currentSections: [],
    }
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/form-ai/assist`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { action: 'none', payload: null, message: 'OK' },
        })
      })
    )

    await formAiApi.assist(dto)

    expect(capturedBody).toEqual(dto)
  })
})

// ── blueprintsApi ─────────────────────────────────────────────────────────────

describe('blueprintsApi', () => {
  it('list hace GET a /form-blueprints', async () => {
    let requestUrl: string | null = null

    server.use(
      http.get(`${BASE}/form-blueprints`, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    await blueprintsApi.list()

    expect(requestUrl).toContain('/form-blueprints')
  })

  it('use hace POST a /form-blueprints/{id}/use con el id correcto', async () => {
    const id = 'blueprint-001'
    let capturedPath: string | null = null

    server.use(
      http.post(`${BASE}/form-blueprints/:id/use`, ({ request }) => {
        capturedPath = request.url
        return HttpResponse.json({
          success: true,
          data: { id: 'template-from-blueprint', name: 'Inspección de EPP' },
        })
      })
    )

    await blueprintsApi.use(id)

    expect(capturedPath).toContain(`/form-blueprints/${id}/use`)
  })
})
