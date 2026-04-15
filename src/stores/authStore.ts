import { create } from 'zustand'
import { JWTPayload, UserRole } from '@/types'
import { registerTokenHelpers } from '@/lib/api'

interface AuthState {
  token: string | null
  user: JWTPayload | null
  workLocationId: string | null
  setToken: (token: string) => void
  setWorkLocation: (id: string) => void
  clear: () => void
  isAuthenticated: () => boolean
  hasRole: (role: UserRole) => boolean
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)) as JWTPayload
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Registrar helpers para el interceptor de Axios
  registerTokenHelpers(
    () => get().token,
    () => set({ token: null, user: null, workLocationId: null })
  )

  return {
    token: null,
    user: null,
    workLocationId: null,

    setToken: (token: string) => {
      const user = decodeJWT(token)
      set({ token, user })
    },

    setWorkLocation: (workLocationId: string) => {
      set({ workLocationId })
    },

    clear: () => {
      set({ token: null, user: null, workLocationId: null })
    },

    isAuthenticated: () => {
      const { token, user } = get()
      if (!token || !user) return false
      return user.exp * 1000 > Date.now()
    },

    hasRole: (role: UserRole) => {
      return get().user?.role === role
    },
  }
})
