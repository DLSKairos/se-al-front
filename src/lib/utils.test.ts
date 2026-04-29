import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// vi.mock must be at module top level — Vitest hoists it before imports
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: 'test-jwt-token' }),
  },
}))

import { haversineDistance, slugify, formatDate, formatDateTime, downloadFile } from './utils'

// ── haversineDistance ─────────────────────────────────────────────────────────

describe('haversineDistance', () => {
  it('should return 0 when both points are identical', () => {
    expect(haversineDistance(4.7110, -74.0721, 4.7110, -74.0721)).toBe(0)
  })

  it('should return approximately 238km between Bogotá and Medellín (±5%)', () => {
    // Bogotá: 4.7110, -74.0721 | Medellín: 6.2442, -75.5812
    // Haversine great-circle distance is ~238 km for these coordinates
    const distanceMeters = haversineDistance(4.7110, -74.0721, 6.2442, -75.5812)
    const distanceKm = distanceMeters / 1000
    const expectedKm = 238
    expect(distanceKm).toBeGreaterThan(expectedKm * 0.95)
    expect(distanceKm).toBeLessThan(expectedKm * 1.05)
  })

  it('should return the same value regardless of the order of the points', () => {
    const d1 = haversineDistance(4.7110, -74.0721, 6.2442, -75.5812)
    const d2 = haversineDistance(6.2442, -75.5812, 4.7110, -74.0721)
    expect(d1).toBeCloseTo(d2, 0)
  })
})

// ── slugify ───────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('should convert a two-word string to snake_case', () => {
    expect(slugify('Nombre Completo')).toBe('nombre_completo')
  })

  it('should remove accents/tildes and lowercase', () => {
    expect(slugify('Año de Nacimiento')).toBe('ano_de_nacimiento')
  })

  it('should trim leading/trailing spaces and collapse internal whitespace to single underscore', () => {
    // .trim() removes edges; .replace(/\s+/g, '_') collapses multiple spaces to one _
    expect(slugify('  espacios  al inicio  ')).toBe('espacios_al_inicio')
  })

  it('should convert uppercase letters to lowercase', () => {
    expect(slugify('MAYÚSCULAS')).toBe('mayusculas')
  })
})

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('should format an ISO date string in Spanish (es-CO)', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z')
    // month: 'short' in es-CO produces abbreviated month — "ene" for January
    expect(result).toMatch(/ene/)
    expect(result).toMatch(/2024/)
  })

  it('should include the day number in the output', () => {
    const result = formatDate('2024-06-20T12:00:00.000Z')
    expect(result).toMatch(/20/)
  })
})

// ── formatDateTime ────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('should include both year and a time colon separator', () => {
    const result = formatDateTime('2024-03-10T15:30:00.000Z')
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/:/)
  })

  it('should include abbreviated month in Spanish', () => {
    const result = formatDateTime('2024-07-04T08:00:00.000Z')
    expect(result).toMatch(/jul/)
  })
})

// ── downloadFile ──────────────────────────────────────────────────────────────

describe('downloadFile', () => {
  let fetchSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    const blobData = new Blob(['file content'], { type: 'application/pdf' })

    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blobData),
    })
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-url')
    globalThis.URL.revokeObjectURL = vi.fn()

    clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        el.click = clickSpy as unknown as () => void
      }
      return el
    })

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call fetch with the Authorization Bearer header', async () => {
    await downloadFile('/reports/test.pdf', 'test.pdf')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [, options] = fetchSpy.mock.calls[0]
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer test-jwt-token',
    })
  })

  it('should create an anchor element, append it, click it, and remove it', async () => {
    await downloadFile('/reports/test.pdf', 'informe.pdf')

    expect(clickSpy).toHaveBeenCalledOnce()
    expect(appendChildSpy).toHaveBeenCalledOnce()
    expect(removeChildSpy).toHaveBeenCalledOnce()
  })

  it('should set the correct download filename on the anchor element', async () => {
    const filename = 'reporte-mayo-2024.pdf'

    // Capture the anchor created via the spy already installed in beforeEach
    let capturedAnchor: HTMLAnchorElement | null = null
    const existingSpy = vi.spyOn(document, 'createElement')
    existingSpy.mockImplementation((tag: string) => {
      // Use the real DOM API without going through document.createElement to avoid recursion
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement
      if (tag === 'a') {
        el.click = clickSpy as unknown as () => void
        capturedAnchor = el as HTMLAnchorElement
      }
      return el
    })

    await downloadFile('/reports/test.pdf', filename)

    expect(capturedAnchor).not.toBeNull()
    expect((capturedAnchor as HTMLAnchorElement | null)?.download).toBe(filename)
  })

  it('should throw when the fetch response is not ok', async () => {
    fetchSpy.mockResolvedValue({ ok: false })

    await expect(downloadFile('/reports/error.pdf', 'error.pdf')).rejects.toThrow(
      'Error al descargar el archivo'
    )
  })
})
