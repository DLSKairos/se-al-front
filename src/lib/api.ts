import axios, { AxiosInstance, AxiosResponse } from 'axios'

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
