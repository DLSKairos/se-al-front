import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { tokens, jwtPayloads } from '@/test/msw/fixtures/auth.fixtures'

beforeEach(() => {
  useAuthStore.getState().clear()
})

describe('useAuth', () => {
  describe('estado inicial', () => {
    it('retorna token null cuando el store está limpio', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.token).toBeNull()
    })

    it('retorna user null cuando el store está limpio', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.user).toBeNull()
    })

    it('retorna workLocationId null cuando el store está limpio', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.workLocationId).toBeNull()
    })

    it('isAuthenticated retorna false cuando no hay token ni user', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.isAuthenticated()).toBe(false)
    })
  })

  describe('setToken externo', () => {
    it('el hook refleja el token seteado externamente', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.ADMIN)
      })

      expect(result.current.token).toBe(tokens.ADMIN)
    })

    it('el hook refleja el user decodificado tras setToken', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.ADMIN)
      })

      expect(result.current.user).not.toBeNull()
      expect(result.current.user?.sub).toBe(jwtPayloads.ADMIN.sub)
      expect(result.current.user?.role).toBe('ADMIN')
      expect(result.current.user?.orgId).toBe(jwtPayloads.ADMIN.orgId)
    })

    it('el hook refleja el user correcto para rol OPERATOR', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.OPERATOR)
      })

      expect(result.current.user?.role).toBe('OPERATOR')
      expect(result.current.user?.sub).toBe(jwtPayloads.OPERATOR.sub)
    })

    it('el hook refleja el user correcto para rol SUPER_ADMIN', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.SUPER_ADMIN)
      })

      expect(result.current.user?.role).toBe('SUPER_ADMIN')
    })
  })

  describe('clear externo', () => {
    it('el hook refleja token null tras clear()', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.ADMIN)
      })
      act(() => {
        useAuthStore.getState().clear()
      })

      expect(result.current.token).toBeNull()
    })

    it('el hook refleja user null tras clear()', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.ADMIN)
      })
      act(() => {
        useAuthStore.getState().clear()
      })

      expect(result.current.user).toBeNull()
    })

    it('el hook refleja workLocationId null tras clear()', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setWorkLocation('loc-001')
      })
      act(() => {
        useAuthStore.getState().clear()
      })

      expect(result.current.workLocationId).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('retorna true cuando hay un token con exp en el futuro', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.ADMIN)
      })

      expect(result.current.isAuthenticated()).toBe(true)
    })

    it('retorna false después de clear()', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.ADMIN)
      })
      act(() => {
        useAuthStore.getState().clear()
      })

      expect(result.current.isAuthenticated()).toBe(false)
    })

    it('retorna false cuando el token está expirado', () => {
      const { result } = renderHook(() => useAuth())

      // Construir JWT con exp en el pasado
      const expiredPayload = {
        sub: 'user-exp-001',
        orgId: 'org-test-001',
        role: 'ADMIN',
        jobTitle: 'Admin',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600, // expiró hace 1 hora
      }
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const body = btoa(JSON.stringify(expiredPayload))
      const expiredToken = `${header}.${body}.test-signature`

      act(() => {
        useAuthStore.getState().setToken(expiredToken)
      })

      expect(result.current.isAuthenticated()).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('retorna true cuando el user tiene el rol consultado', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.ADMIN)
      })

      expect(result.current.hasRole('ADMIN')).toBe(true)
    })

    it('retorna false cuando el user no tiene el rol consultado', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        useAuthStore.getState().setToken(tokens.OPERATOR)
      })

      expect(result.current.hasRole('ADMIN')).toBe(false)
    })

    it('retorna false cuando no hay user', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.hasRole('ADMIN')).toBe(false)
    })
  })
})
