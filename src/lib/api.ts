import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type {
  AIExtractResult,
  AIGenerateResult,
  AIAssistResult,
  EditorSection,
  EditorField,
  FormBlueprint,
  FormTemplate,
  InventarioSession,
  InventarioItem,
  InventarioFoto,
  DatosFacturaExtraida,
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Request interceptor — inyecta el JWT
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — unwrap { success, data } y maneja 401
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Para descargas (blob), retornar respuesta directa
    if (response.config.responseType === 'blob') return response
    // Unwrap del wrapper { success: true, data: ... }
    if (response.data && 'data' in response.data) {
      return { ...response, data: response.data.data }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Token helpers — los usa el interceptor
// El store de Zustand los registra al inicializar
let _getToken: () => string | null = () => null
let _clearToken: () => void = () => {}

export function registerTokenHelpers(
  getToken: () => string | null,
  clearToken: () => void
) {
  _getToken = getToken
  _clearToken = clearToken
}

function getToken() { return _getToken() }
function clearToken() { _clearToken() }

export default api

// ── Form AI ────────────────────────────────────────────────────────────────────

export const formAiApi = {
  extractFromFile: (formData: FormData) =>
    api.post<AIExtractResult>('/form-ai/extract-from-file', formData, {
      headers: { 'Content-Type': undefined },
    }),
  generateFromDescription: (dto: {
    description: string
    columns: 1 | 2 | 3
    observationsPerSection: boolean
  }) => api.post<AIGenerateResult>('/form-ai/generate-from-description', dto),
  assist: (dto: { message: string; currentSections: EditorSection[] }) =>
    api.post<AIAssistResult>('/form-ai/assist', dto),
}

// ── Blueprints ─────────────────────────────────────────────────────────────────

export const blueprintsApi = {
  list: (filters?: { category?: string; search?: string }) =>
    api.get<FormBlueprint[]>('/form-blueprints', { params: filters }),
  create: (dto: {
    name: string
    description?: string
    category: string
    fields: EditorField[]
  }) => api.post<FormBlueprint>('/form-blueprints', dto),
  use: (id: string) =>
    api.post<FormTemplate>(`/form-blueprints/${id}/use`),
}

// ── Admin AI Chat ────────────────────────────────────────────────────────────

export const adminAiApi = {
  chat: (dto: { message: string; history: Array<{ role: string; content: string }> }) =>
    api.post<{ response: string }>('/form-ai/admin-chat', dto),
}

// ── Inventarios ──────────────────────────────────────────────────────────────

export const inventariosApi = {
  // Sesiones
  listarSesiones: () =>
    api.get<InventarioSession[]>('/inventarios/sesiones'),

  obtenerSesion: (id: string) =>
    api.get<InventarioSession>(`/inventarios/sesiones/${id}`),

  crearSesion: (data: Partial<InventarioSession>) =>
    api.post<InventarioSession>('/inventarios/sesiones', data),

  actualizarSesion: (id: string, data: Partial<InventarioSession>) =>
    api.patch<InventarioSession>(`/inventarios/sesiones/${id}`, data),

  eliminarSesion: (id: string) =>
    api.delete(`/inventarios/sesiones/${id}`),

  // Items
  agregarItem: (sessionId: string, data: Partial<InventarioItem>) =>
    api.post<InventarioItem>(`/inventarios/sesiones/${sessionId}/items`, data),

  actualizarItem: (sessionId: string, itemId: string, data: Partial<InventarioItem>) =>
    api.patch<InventarioItem>(`/inventarios/sesiones/${sessionId}/items/${itemId}`, data),

  eliminarItem: (sessionId: string, itemId: string) =>
    api.delete(`/inventarios/sesiones/${sessionId}/items/${itemId}`),

  // Fotos
  subirFoto: (sessionId: string, tipo: string, file: File, itemId?: string) => {
    const form = new FormData()
    form.append('foto', file)
    form.append('tipo', tipo)
    if (itemId) form.append('item_id', itemId)
    return api.post<InventarioFoto>(`/inventarios/sesiones/${sessionId}/fotos`, form, {
      headers: { 'Content-Type': undefined },
    })
  },

  eliminarFoto: (sessionId: string, fotoId: string) =>
    api.delete(`/inventarios/sesiones/${sessionId}/fotos/${fotoId}`),

  // IA
  extraerFactura: (file: File) => {
    const form = new FormData()
    form.append('imagen', file)
    return api.post<{ success: boolean; data: DatosFacturaExtraida | null; error?: string }>(
      '/inventarios/extraer-factura',
      form,
      { headers: { 'Content-Type': undefined } },
    )
  },

  // Firmas
  firmarSesion: (
    id: string,
    data: {
      deposito?: { nombre: string; url: string }
      agencia?: { nombre: string; url: string }
    },
  ) => api.patch<InventarioSession>(`/inventarios/sesiones/${id}/firmar`, data),
}
