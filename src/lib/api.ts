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
  AppNotification,
  CreateBulkNotificationDto,
  FeatureFlags,
  MagicLinkInfo,
  MagicLinkHistoryItem,
  ExternalSigner,
  SignatureTokenInfo,
  SignatureStatusEntry,
  SignatureConfig,
  StrokeVector,
  ReadingLogEntry,
  PublicSignatureView,
  SignatureMode,
  SubmissionStatus,
  FormSubmission,
  OrgWithUsage,
  OrgConfig,
  OrgUsage,
  AdminUser,
  MasterItem,
  MasterSuggestion,
  UserContext,
  PlanTier,
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
// Callback opcional para limpiar el caché de React Query en logout
let _onLogout: () => void = () => {}

export function registerTokenHelpers(
  getToken: () => string | null,
  clearToken: () => void
) {
  _getToken = getToken
  _clearToken = clearToken
}

export function registerLogoutCallback(onLogout: () => void) {
  _onLogout = onLogout
}

function getToken() { return _getToken() }
function clearToken() {
  _clearToken()
  _onLogout()
}

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
    return api.post<DatosFacturaExtraida | null>(
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

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  /** GET /notifications — lista paginada del usuario autenticado */
  list: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) =>
    api.get<{ data: AppNotification[]; total: number }>('/notifications', { params }),

  /** PATCH /notifications/:id/read */
  markAsRead: (id: string) =>
    api.patch<AppNotification>(`/notifications/${id}/read`),

  /** PATCH /notifications/read-all */
  markAllAsRead: () =>
    api.patch<{ updated: number }>('/notifications/read-all'),

  /** POST /admin/notifications — envío masivo por admin */
  createBulk: (dto: CreateBulkNotificationDto) =>
    api.post<{ count: number }>('/admin/notifications', dto),

  /** GET /admin/notifications/sent — historial de notificaciones enviadas por admin */
  listSent: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: AppNotification[]; total: number }>('/admin/notifications/sent', { params }),
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export const featureFlagsApi = {
  /** GET /feature-flags — público, cacheable 30s */
  getAll: () =>
    api.get<FeatureFlags>('/feature-flags'),

  /** PATCH /superadmin/feature-flags/:flag — solo SUPER_ADMIN */
  setFlag: (flag: string, enabled: boolean) =>
    api.patch<{ flag: string; enabled: boolean }>(`/superadmin/feature-flags/${flag}`, { enabled }),
}

// ── Magic Link ────────────────────────────────────────────────────────────────

export const magicLinkApi = {
  /** GET /auth/magic-link?token=xxx — público, valida sin consumir */
  validate: (token: string) =>
    api.get<MagicLinkInfo>('/auth/magic-link', { params: { token } }),

  // NOTA: el magic link de primer acceso se genera vía
  // superadminApi.generateFirstAdminLink (valida pertenencia a la org).

  /** POST /admin/magic-link/invite */
  generateInvite: (userId: string) =>
    api.post<{ tokenId: string; link: string }>('/admin/magic-link/invite', { userId }),

  /** POST /admin/magic-link/resend/:tokenId */
  resend: (tokenId: string) =>
    api.post<{ tokenId: string; link: string }>(`/admin/magic-link/resend/${tokenId}`),

  /** GET /superadmin/magic-link/history?orgId=xxx */
  history: (orgId: string) =>
    api.get<MagicLinkHistoryItem[]>('/superadmin/magic-link/history', { params: { orgId } }),
}

// ── Signatures (autenticado) ──────────────────────────────────────────────────

export const signaturesApi = {
  // Catálogo de firmantes externos
  listExternalSigners: (workLocationId: string) =>
    api.get<ExternalSigner[]>('/signatures/external-signers', {
      params: { workLocationId },
    }),

  createExternalSigner: (dto: {
    name: string
    identification_number: string
    phone: string
    work_location_id: string
  }) => api.post<ExternalSigner>('/signatures/external-signers', dto),

  // Tokens de firma
  createSignatureToken: (dto: {
    submission_id: string
    external_signer_id: string
  }) => api.post<SignatureTokenInfo>('/signatures/tokens', dto),

  markLinkSent: (signature_token_id: string) =>
    api.post<void>('/signatures/tokens/mark-sent', { signature_token_id }),

  getSubmissionStatus: (submissionId: string) =>
    api.get<SignatureStatusEntry[]>(`/signatures/submissions/${submissionId}/status`),

  // Firma interna
  signInternal: (
    submissionId: string,
    dto: {
      stroke_vectors: StrokeVector[]
      stroke_image_base64: string
      geo_lat: number
      geo_lng: number
      geo_accuracy?: number
      reading_log: ReadingLogEntry[]
      webauthn_session_active?: boolean
    },
  ) => api.post<{ signed_at: string }>(`/signatures/submissions/${submissionId}/sign`, dto),

  // Verificación de integridad
  verifyIntegrity: (submissionId: string) =>
    api.get<{ valid: boolean; document_hash: string }>(`/signatures/submissions/${submissionId}/verify`),

  // URLs firmadas para ver identidad (solo ADMIN)
  getIdentityUrls: (signerId: string) =>
    api.get<{ photo_id_url: string; selfie_url: string }>(
      `/signatures/external-signers/${signerId}/identity-urls`,
    ),

  // Config de firma por template (solo ADMIN)
  getConfig: (templateId: string) =>
    api.get<SignatureConfig>(`/signatures/templates/${templateId}/config`),

  updateConfig: (
    templateId: string,
    dto: {
      signature_mode?: SignatureMode
      min_reading_seconds?: number
      requires_internal_sign?: boolean
    },
  ) => api.put<SignatureConfig>(`/signatures/templates/${templateId}/config`, dto),
}

// ── Public Signature (sin auth de JWT de SEÑAL) ───────────────────────────────
//
// Estas rutas son accesibles por firmantes externos que NO tienen JWT.
// El interceptor de Axios agrega el header Authorization solo si hay token;
// si no hay token registrado (_getToken retorna null), no añade el header → correcto.

export const publicSignatureApi = {
  /** GET /public/signature/:token — vista del documento */
  getView: (token: string) =>
    api.get<PublicSignatureView>(`/public/signature/${token}`),

  /**
   * POST /public/signature/:token/identity — multipart con foto_cedula + selfie.
   * Se envía FormData, por eso se sobreescribe Content-Type.
   */
  uploadIdentity: (token: string, fotoCedula: File, selfie: File) => {
    const form = new FormData()
    form.append('foto_cedula', fotoCedula)
    form.append('selfie', selfie)
    return api.post<{ ok: boolean }>(`/public/signature/${token}/identity`, form, {
      headers: { 'Content-Type': undefined },
    })
  },

  /** POST /public/signature/:token/sign — registra la firma del externo */
  sign: (
    token: string,
    dto: {
      stroke_vectors: StrokeVector[]
      stroke_image_base64: string
      geo_lat: number
      geo_lng: number
      geo_accuracy?: number
      reading_log: ReadingLogEntry[]
    },
  ) => api.post<{ signed_at: string }>(`/public/signature/${token}/sign`, dto),
}

// ── Approval (Admin) ──────────────────────────────────────────────────────────

export const approvalApi = {
  /**
   * GET /admin/submissions?status=...&page=...&limit=...
   * Lista submissions de la org con filtro opcional de estado.
   */
  listAdminSubmissions: (params?: {
    status?: SubmissionStatus
    page?: number
    limit?: number
  }) =>
    api.get<{ data: FormSubmission[]; total: number }>('/admin/submissions', { params }),

  /**
   * PATCH /admin/submissions/:id/reject — body: { reason } (mín 10 chars)
   */
  rejectSubmission: (id: string, reason: string) =>
    api.patch<FormSubmission>(`/admin/submissions/${id}/reject`, { reason }),
}

// ── SuperAdmin ────────────────────────────────────────────────────────────────

export const superadminApi = {
  /** GET /superadmin/organizations */
  listOrganizations: () =>
    api.get<OrgWithUsage[]>('/superadmin/organizations'),

  /** GET /superadmin/organizations/:id */
  getOrganization: (id: string) =>
    api.get<OrgWithUsage>(`/superadmin/organizations/${id}`),

  /** PATCH /superadmin/organizations/:id/config */
  updateConfig: (
    id: string,
    dto: {
      display_name?: string
      plan?: PlanTier
      max_users?: number
      max_sites?: number
      logo_url?: string
      primary_color?: string
    },
  ) => api.patch<OrgConfig>(`/superadmin/organizations/${id}/config`, dto),

  /** GET /superadmin/organizations/:id/usage */
  getUsage: (id: string) =>
    api.get<OrgUsage>(`/superadmin/organizations/${id}/usage`),

  /** GET /superadmin/organizations/:id/administrators */
  listAdministrators: (orgId: string) =>
    api.get<AdminUser[]>(`/superadmin/organizations/${orgId}/administrators`),

  /** POST /superadmin/organizations/:id/first-admin-link */
  generateFirstAdminLink: (orgId: string, userId: string) =>
    api.post<{ tokenId: string; link: string }>(
      `/superadmin/organizations/${orgId}/first-admin-link`,
      { userId },
    ),

  /** GET /superadmin/magic-link/history?orgId=xxx */
  getMagicLinkHistory: (orgId: string) =>
    api.get<MagicLinkHistoryItem[]>('/superadmin/magic-link/history', {
      params: { orgId },
    }),

  /** PATCH /superadmin/feature-flags/:flag */
  setFeatureFlag: (flag: string, enabled: boolean) =>
    featureFlagsApi.setFlag(flag, enabled),
}

// ── Admin Management ──────────────────────────────────────────────────────────

export const adminManagementApi = {
  /** GET /admin/administrators */
  list: () =>
    api.get<AdminUser[]>('/admin/administrators'),

  /**
   * POST /admin/administrators
   * Crea nuevo administrador y genera magic link de invitación automáticamente.
   */
  create: (dto: { name: string; email: string; identification_number?: string }) =>
    api.post<AdminUser>('/admin/administrators', dto),

  /** PATCH /admin/administrators/:id/deactivate */
  deactivate: (id: string) =>
    api.patch<AdminUser>(`/admin/administrators/${id}/deactivate`),

  /** PATCH /admin/administrators/:id/reactivate */
  reactivate: (id: string) =>
    api.patch<AdminUser>(`/admin/administrators/${id}/reactivate`),
}

// ── Master Lists ──────────────────────────────────────────────────────────────

export const masterListsApi = {
  // Lectura (todos los usuarios autenticados)
  getPositions: () => api.get<MasterItem[]>('/master/positions'),
  getRoles: () => api.get<MasterItem[]>('/master/roles'),
  getDepartments: () => api.get<MasterItem[]>('/master/departments'),

  /** POST /master/suggestions — sugerir un valor nuevo */
  createSuggestion: (dto: { entity_type: string; value: string }) =>
    api.post<MasterSuggestion>('/master/suggestions', dto),

  // Gestión (solo ADMIN)
  createPosition: (dto: { name: string }) =>
    api.post<MasterItem>('/admin/master/positions', dto),
  createRole: (dto: { name: string }) =>
    api.post<MasterItem>('/admin/master/roles', dto),
  createDepartment: (dto: { name: string }) =>
    api.post<MasterItem>('/admin/master/departments', dto),

  updateItem: (
    type: 'positions' | 'roles' | 'departments',
    id: string,
    dto: { name: string },
  ) => api.patch<MasterItem>(`/admin/master/${type}/${id}`, dto),

  deactivateItem: (type: 'positions' | 'roles' | 'departments', id: string) =>
    api.patch<MasterItem>(`/admin/master/${type}/${id}/deactivate`),

  // Sugerencias (solo ADMIN)
  listSuggestions: () => api.get<MasterSuggestion[]>('/admin/master/suggestions'),

  approveSuggestion: (id: string) =>
    api.patch<MasterSuggestion>(`/admin/master/suggestions/${id}/approve`),

  rejectSuggestion: (id: string) =>
    api.patch<MasterSuggestion>(`/admin/master/suggestions/${id}/reject`),
}

// ── Status ────────────────────────────────────────────────────────────────────

export const statusApi = {
  /** GET /status/user-context — contexto mínimo del usuario, <300ms, cache Redis 60s */
  getUserContext: () => api.get<UserContext>('/status/user-context'),
}

// ── OAuth helpers (redirects de página completa, NO axios) ───────────────────

/**
 * Construye la URL absoluta de inicio de OAuth con el backend.
 * Se usa con window.location.href = oauthLoginUrl('google') para que el
 * navegador haga la redirección completa (flujo OAuth estándar, no fetch).
 *
 * @param provider  'google' | 'microsoft'
 * @param magicToken  Token de magic link de activación (si se viene de ActivateAccountPage)
 */
export function oauthLoginUrl(
  provider: 'google' | 'microsoft',
  magicToken?: string,
): string {
  // Quita el sufijo '/api' de la base URL para obtener la raíz del servidor
  const serverBase = BASE_URL.replace(/\/api\/?$/, '')
  const url = new URL(`/auth/${provider}`, serverBase)
  if (magicToken) url.searchParams.set('magicToken', magicToken)
  return url.toString()
}
