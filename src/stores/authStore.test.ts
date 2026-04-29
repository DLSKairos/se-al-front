import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './authStore'
import { tokens, jwtPayloads } from '@/test/msw/fixtures/auth.fixtures'

// Mock de @/lib/api para evitar efectos secundarios del interceptor de Axios
vi.mock('@/lib/api', () => ({
  registerTokenHelpers: vi.fn(),
  default: {},
}))

function resetStore() {
  useAuthStore.setState({ token: null, user: null, workLocationId: null })
  localStorage.clear()
}

describe('authStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ── setToken ────────────────────────────────────────────────────────────────

  describe('setToken(validToken)', () => {
    it('guarda el token en el store', () => {
      useAuthStore.getState().setToken(tokens.OPERATOR)
      expect(useAuthStore.getState().token).toBe(tokens.OPERATOR)
    })

    it('decodifica correctamente el sub del payload', () => {
      useAuthStore.getState().setToken(tokens.OPERATOR)
      expect(useAuthStore.getState().user?.sub).toBe(jwtPayloads.OPERATOR.sub)
    })

    it('decodifica correctamente el orgId del payload', () => {
      useAuthStore.getState().setToken(tokens.ADMIN)
      expect(useAuthStore.getState().user?.orgId).toBe(jwtPayloads.ADMIN.orgId)
    })

    it('decodifica correctamente el role del payload', () => {
      useAuthStore.getState().setToken(tokens.ADMIN)
      expect(useAuthStore.getState().user?.role).toBe('ADMIN')
    })

    it('decodifica correctamente el jobTitle del payload', () => {
      useAuthStore.getState().setToken(tokens.SUPER_ADMIN)
      expect(useAuthStore.getState().user?.jobTitle).toBe(jwtPayloads.SUPER_ADMIN.jobTitle)
    })
  })

  describe('setToken(expiredToken)', () => {
    it('guarda el token aunque esté expirado', () => {
      const expiredPayload = {
        sub: 'user-expired-001',
        orgId: 'org-test-001',
        role: 'OPERATOR' as const,
        jobTitle: 'Operador',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600, // expirado hace 1 hora
      }
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const body = btoa(JSON.stringify(expiredPayload))
      const expiredToken = `${header}.${body}.test-signature`

      useAuthStore.getState().setToken(expiredToken)

      expect(useAuthStore.getState().token).toBe(expiredToken)
    })

    it('isAuthenticated() retorna false con token expirado', () => {
      const expiredPayload = {
        sub: 'user-expired-001',
        orgId: 'org-test-001',
        role: 'OPERATOR' as const,
        jobTitle: 'Operador',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      }
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const body = btoa(JSON.stringify(expiredPayload))
      const expiredToken = `${header}.${body}.test-signature`

      useAuthStore.getState().setToken(expiredToken)

      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })
  })

  // ── isAuthenticated ─────────────────────────────────────────────────────────

  describe('isAuthenticated()', () => {
    it('retorna true con token válido y exp futuro', () => {
      useAuthStore.getState().setToken(tokens.OPERATOR)
      expect(useAuthStore.getState().isAuthenticated()).toBe(true)
    })

    it('retorna false sin token', () => {
      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })

    it('retorna false con token expirado', () => {
      const expiredPayload = {
        sub: 'user-001',
        orgId: 'org-001',
        role: 'OPERATOR' as const,
        jobTitle: 'Operador',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 1,
      }
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const body = btoa(JSON.stringify(expiredPayload))
      const expiredToken = `${header}.${body}.test-signature`

      useAuthStore.getState().setToken(expiredToken)

      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })
  })

  // ── hasRole ─────────────────────────────────────────────────────────────────

  describe('hasRole(role)', () => {
    it('OPERATOR: hasRole("OPERATOR") retorna true', () => {
      useAuthStore.getState().setToken(tokens.OPERATOR)
      expect(useAuthStore.getState().hasRole('OPERATOR')).toBe(true)
    })

    it('OPERATOR: hasRole("ADMIN") retorna false', () => {
      useAuthStore.getState().setToken(tokens.OPERATOR)
      expect(useAuthStore.getState().hasRole('ADMIN')).toBe(false)
    })

    it('ADMIN: hasRole("ADMIN") retorna true', () => {
      useAuthStore.getState().setToken(tokens.ADMIN)
      expect(useAuthStore.getState().hasRole('ADMIN')).toBe(true)
    })

    it('ADMIN: hasRole("SUPER_ADMIN") retorna false', () => {
      useAuthStore.getState().setToken(tokens.ADMIN)
      expect(useAuthStore.getState().hasRole('SUPER_ADMIN')).toBe(false)
    })

    it('SUPER_ADMIN: hasRole("SUPER_ADMIN") retorna true', () => {
      useAuthStore.getState().setToken(tokens.SUPER_ADMIN)
      expect(useAuthStore.getState().hasRole('SUPER_ADMIN')).toBe(true)
    })
  })

  // ── setWorkLocation ─────────────────────────────────────────────────────────

  describe('setWorkLocation(id)', () => {
    it('actualiza workLocationId en el store', () => {
      useAuthStore.getState().setWorkLocation('location-abc-123')
      expect(useAuthStore.getState().workLocationId).toBe('location-abc-123')
    })

    it('sobreescribe un workLocationId previo', () => {
      useAuthStore.getState().setWorkLocation('location-001')
      useAuthStore.getState().setWorkLocation('location-002')
      expect(useAuthStore.getState().workLocationId).toBe('location-002')
    })
  })

  // ── clear ───────────────────────────────────────────────────────────────────

  describe('clear()', () => {
    beforeEach(() => {
      useAuthStore.getState().setToken(tokens.ADMIN)
      useAuthStore.getState().setWorkLocation('location-001')
    })

    it('token queda null', () => {
      useAuthStore.getState().clear()
      expect(useAuthStore.getState().token).toBeNull()
    })

    it('user queda null', () => {
      useAuthStore.getState().clear()
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('workLocationId queda null', () => {
      useAuthStore.getState().clear()
      expect(useAuthStore.getState().workLocationId).toBeNull()
    })

    it('isAuthenticated() retorna false después de clear', () => {
      useAuthStore.getState().clear()
      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })
  })

  // ── Persistencia en localStorage ────────────────────────────────────────────

  describe('persistencia en localStorage', () => {
    it('después de setToken, localStorage contiene la clave "senal-auth" con el token', () => {
      useAuthStore.getState().setToken(tokens.OPERATOR)

      const raw = localStorage.getItem('senal-auth')
      expect(raw).not.toBeNull()

      const parsed = JSON.parse(raw!)
      expect(parsed.state.token).toBe(tokens.OPERATOR)
    })
  })
})
