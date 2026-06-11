// ── Auth ──────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR'

export interface JWTPayload {
  sub: string
  orgId: string
  orgName: string
  role: UserRole
  jobTitle: string
  iat: number
  exp: number
}

export interface User {
  id: string
  org_id: string
  work_location_id: string | null
  name: string
  identification_number: string
  job_title: string
  role: UserRole
  is_active: boolean
  pin_enabled: boolean
  created_at: string
  work_location?: WorkLocation
  webauthn_credentials?: WebAuthnCredential[]
}

export interface WebAuthnCredential {
  id: string
  user_id: string
  credential_id: string
  created_at: string
}

// ── Organization ──────────────────────────────────
export interface Organization {
  id: string
  name: string
  created_at: string
}

// ── Department ────────────────────────────────────
export interface Department {
  id: string
  org_id: string
  name: string
  email: string
}

// ── WorkLocation ──────────────────────────────────
export interface WorkLocation {
  id: string
  org_id: string
  department_id: string | null
  name: string
  contractor: string
  lat: number
  lng: number
  is_active: boolean
  created_at: string
}

// ── Form Categories ───────────────────────────────
export interface FormCategory {
  id: string
  org_id: string
  name: string
  is_sst: boolean
  created_at: string
}

// ── Form Templates ────────────────────────────────
export type FormTemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type Frequency = 'INHERIT' | 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PER_EVENT' | 'ONCE'
export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'DATETIME' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN' | 'SIGNATURE' | 'PHOTO' | 'GEOLOCATION' | 'FILE'

export interface FormTemplate {
  id: string
  org_id: string
  category_id: string
  name: string
  description: string | null
  icon: string | null
  status: FormTemplateStatus
  data_frequency: Frequency
  signature_frequency: Frequency
  export_pdf: boolean
  export_excel: boolean
  target_job_titles: string[]
  created_by: string
  created_at: string
  updated_at: string
  fields?: FormField[]
  notifications?: FormNotification[]
}

export interface FormField {
  id: string
  template_id: string
  order: number
  label: string
  key: string
  type: FieldType
  required: boolean
  default_value: string | null
  help_text?: string | null
  options: Array<{ label: string; value: string }> | null
  validations: Record<string, unknown> | null
  revalidation_frequency: Frequency
}

// ── Form Submissions ──────────────────────────────
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_SIGNATURES' | 'APPROVED' | 'REJECTED'

export interface FormSubmission {
  id: string
  template_id: string
  org_id: string
  submitted_by: string
  work_location_id: string | null
  submitted_at: string
  status: SubmissionStatus
  period_key: string | null
  data: Record<string, unknown>
  geo_lat: number | null
  geo_lng: number | null
  template?: { name: string }
  submitter?: { name: string }
  work_location?: { name: string }
  values?: FormSubmissionValue[]
  signatures?: FormSignature[]
}

export interface FormSubmissionValue {
  id: string
  submission_id: string
  field_id: string
  value_text: string | null
  value_number: number | null
  value_date: string | null
  value_json: unknown | null
  value_file: string | null
  field?: { id: string; label: string; field_type: string }
}

export interface FormSignature {
  id: string
  submission_id: string
  signer_name: string
  signer_role: string | null
  signer_doc: string | null
  signature_url: string
  signed_at: string
}

// ── Form Notifications ────────────────────────────
export type NotificationTrigger = 'ON_SUBMIT' | 'ON_APPROVE' | 'ON_REJECT' | 'SCHEDULED'

export interface FormNotification {
  id: string
  template_id: string
  trigger: NotificationTrigger
  recipients: Array<{ type: 'role' | 'email' | 'department'; value: string }>
  channels: string[]
  subject: string | null
  body: string | null
  enabled: boolean
}

// ── Attendance ────────────────────────────────────
export interface AttendanceConfig {
  id: string
  org_id: string
  is_enabled: boolean
  standard_daily_hours: number
  night_shift_start: string
  night_shift_end: string
  sunday_surcharge: boolean
  holiday_surcharge: boolean
  custom_holidays: string[]
}

export interface AttendanceRecord {
  id: string
  org_id: string
  user_id: string
  work_location_id: string | null
  service_date: string
  entry_time: string
  exit_time: string | null
  lunch_minutes: number | null
  total_minutes: number | null
  regular_minutes: number | null
  extra_day_minutes: number | null
  extra_night_minutes: number | null
  extra_sunday_minutes: number | null
  extra_holiday_minutes: number | null
  user?: { name: string }
  work_location?: { name: string }
}

// ── Webhook ───────────────────────────────────────
export interface WebhookEndpoint {
  id: string
  org_id: string
  url: string
  secret: string
  event_types: string[] | null
  is_active: boolean
  created_at: string
}

// ── Dashboard Stats ───────────────────────────────
export interface DashboardStats {
  total_users: number
  active_users: number
  total_submissions: number
  by_status: Record<SubmissionStatus, number>
  trend: Array<{ month: string; submissions: number; unique_users: number }>
  by_template: Array<{ template_id: string; name: string; count: number }>
  recent: Array<{
    id: string
    submitted_by: string
    template_name: string
    work_location: string
    submitted_at: string
    status: SubmissionStatus
  }>
}

// ── Form Submission Context ───────────────────────
export interface FormContext {
  template:        FormTemplate & { fields: FormField[] }
  last_submission: FormSubmission | null
  is_readonly:     boolean
}

// ── API Response wrapper ──────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface ApiError {
  success: false
  statusCode: number
  message: string
  timestamp: string
  path: string
}

// ─── EDITOR DE FORMULARIOS ────────────────────────────────

export interface EditorField {
  id: string
  label: string
  key: string
  type: FieldType
  required: boolean
  options?: string[]
  placeholder?: string
  helpText?: string
  defaultValue?: string
  section?: string
}

export interface EditorSection {
  id: string
  name: string
  hasObservations: boolean
  fields: EditorField[]
}

export interface EditorState {
  templateId?: string
  name: string
  categoryId: string
  columns: 1 | 2 | 3
  sections: EditorSection[]
  sourceFileUrl?: string
  blueprintId?: string
  isDirty: boolean
  status: 'DRAFT' | 'ACTIVE'
  targetJobTitles: string[]
}

// ─── BLUEPRINTS ───────────────────────────────────────────

export interface FormBlueprint {
  id: string
  name: string
  description: string | null
  category: string
  is_global: boolean
  org_id: string | null
  fields: EditorField[]
  created_at: string
}

// ─── RESPUESTAS DE IA ─────────────────────────────────────

export interface AIExtractResult {
  fields: EditorField[]
  source_filename: string
  source_file_url: string
  aiError?: boolean
}

export interface AIGenerateResult {
  name: string
  sections: EditorSection[]
  aiError?: boolean
}

export type AIAssistPayload =
  | { sections: EditorSection[] }
  | { sectionId: string; field: Partial<EditorField> }
  | { columns: 1 | 2 | 3 }
  | Record<string, never>

export interface AIAssistResult {
  action: 'update_sections' | 'add_field' | 'set_columns' | 'none'
  payload: AIAssistPayload
  message?: string
  aiError?: boolean
}

// ─── INVENTARIOS ──────────────────────────────────────────

export interface InventarioAccesorio {
  id: string
  item_id: string
  parte_no: string | null
  pais: string | null
  descripcion: string | null
  marca: string | null
  modelo: string | null
}

export interface InventarioFoto {
  id: string
  session_id: string
  item_id: string | null
  tipo: 'inicio_carga' | 'fin_carga' | 'item'
  url: string
  created_at: string
}

export interface InventarioItem {
  id: string
  session_id: string
  numero: number
  parte_no: string | null
  pais: string | null
  descripcion: string | null
  marca: string | null
  modelo: string | null
  serial: string | null
  cantidad: number | null
  extraido_por_ia: boolean
  tipo_novedad: string | null
  accesorios: InventarioAccesorio[]
  fotos: InventarioFoto[]
}

export interface InventarioSession {
  id: string
  org_id: string
  tipo_formulario: string
  estado: 'borrador' | 'completado' | 'firmado' | 'cerrado'
  agencia_aduanas: string | null
  codigo_agencia: string | null
  representante_legal: string | null
  mandato: string | null
  deposito: string | null
  direccion_deposito: string | null
  documento_transporte: string | null
  manifiesto: string | null
  fecha_manifiesto: string | null
  transportadora: string | null
  consignatario: string | null
  no_bultos: number | null
  peso: number | null
  precintos_retira: string | null
  precintos_coloca: string | null
  observaciones: string | null
  firmado_deposito_nombre: string | null
  firmado_agencia_nombre: string | null
  firmado_deposito_url: string | null
  firmado_agencia_url: string | null
  firmado_deposito_at: string | null
  firmado_agencia_at: string | null
  created_at: string
  updated_at: string
  items?: InventarioItem[]
  fotos?: InventarioFoto[]
  _count?: { items: number; fotos: number }
}

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────

/**
 * Tipos de notificación del sistema (espejo del enum NotificationType de Prisma).
 */
export type NotificationType =
  | 'FORM_SUBMITTED'
  | 'FORM_APPROVED'
  | 'FORM_REJECTED'
  | 'FORM_PENDING_SIGNATURE'
  | 'MAGIC_LINK_SENT'
  | 'SYSTEM_ALERT'
  | 'CUSTOM_ADMIN'

/**
 * Notificación de la aplicación (se usa AppNotification para no chocar con
 * el Notification del DOM).
 */
export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  read_at: string | null
  deep_link: string | null
  created_at: string
  created_by_admin_id: string | null
}

/**
 * Target de notificaciones masivas enviadas por admin.
 */
export type BulkNotificationTarget = 'ALL' | 'SITE' | 'SPECIFIC'

/**
 * DTO para crear notificación masiva desde el panel admin.
 */
export interface CreateBulkNotificationDto {
  title: string
  body: string
  target: BulkNotificationTarget
  work_location_id?: string
  user_ids?: string[]
  deep_link?: string
}

// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────

/**
 * Mapa de feature flags que retorna GET /feature-flags.
 * Las claves son los nombres conocidos del sistema.
 */
export interface FeatureFlags {
  oauth_google: boolean
  oauth_microsoft: boolean
  electronic_signature: boolean
  magic_link: boolean
  superadmin_panel: boolean
  [key: string]: boolean
}

// ─── PLAN / ORG CONFIG ───────────────────────────────────────────────────────

export type PlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'

/**
 * Configuración de plan y personalización de una organización.
 * Espejo del modelo OrgConfig de Prisma.
 */
export interface OrgConfig {
  id: string
  org_id: string
  plan: PlanTier
  max_users: number
  max_sites: number
  display_name: string
  logo_url: string | null
  primary_color: string | null
  updated_at: string
  updated_by_super_admin_id: string | null
}

/**
 * Métricas de uso de una organización.
 * Retornado por GET /superadmin/organizations/:id/usage.
 */
export interface OrgUsage {
  current_users: number
  max_users: number
  current_sites: number
  max_sites: number
  plan: PlanTier
}

/**
 * Organización con su config y métricas de uso.
 * Retornado por GET /superadmin/organizations y GET /superadmin/organizations/:id.
 */
export interface OrgWithUsage {
  id: string
  name: string
  created_at: string
  config: OrgConfig | null
  usage: OrgUsage
}

// ─── ADMINISTRADORES ─────────────────────────────────────────────────────────

/**
 * Administrador de una organización con estado de activación OAuth.
 * Retornado por GET /admin/administrators.
 */
export interface AdminUser {
  id: string
  name: string
  email: string | null
  identification_number: string
  is_active: boolean
  oauth_provider: 'GOOGLE' | 'MICROSOFT' | null
  /** true si ya completó el flujo OAuth de activación */
  is_activated: boolean
  created_at: string
}

// ─── MAGIC LINK ───────────────────────────────────────────────────────────────

export type MagicLinkPurpose = 'FIRST_ACCESS_ADMIN' | 'ADMIN_INVITE'

/**
 * Respuesta de GET /auth/magic-link?token=xxx.
 * Permite mostrar la pantalla de activación antes de completar OAuth.
 */
export interface MagicLinkInfo {
  valid: boolean
  error?: 'TOKEN_NOT_FOUND' | 'TOKEN_EXPIRED' | 'TOKEN_USED'
  /** Nombre del usuario destinatario */
  user_name?: string
  /** Nombre de la organización */
  org_name?: string
  purpose?: MagicLinkPurpose
}

/**
 * Entrada del historial de magic links.
 * Retornado por GET /superadmin/magic-link/history?orgId=xxx.
 */
export interface MagicLinkHistoryItem {
  id: string
  token: string
  user_id: string
  purpose: MagicLinkPurpose
  expires_at: string
  used_at: string | null
  created_by_super_admin: boolean
  created_at: string
  user?: { name: string; email: string | null }
}

// ─── LISTAS MAESTRAS ──────────────────────────────────────────────────────────

export type MasterListType = 'roles' | 'positions' | 'departments'

export type MasterEntityType = 'POSITION' | 'ROLE' | 'DEPARTMENT'

export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Elemento de lista maestra (cargo, rol operativo o departamento).
 * Campos comunes entre MasterPosition, MasterRole y Department.
 */
export interface MasterItem {
  id: string
  name: string
  /** null = registro global (seed de Kairos) */
  org_id: string | null
  active: boolean
  created_at: string
}

/**
 * Solicitud de sugerencia de valor nuevo en lista maestra.
 */
export interface MasterSuggestion {
  id: string
  org_id: string
  suggested_by: string
  entity_type: MasterEntityType
  value: string
  status: SuggestionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  suggester?: { name: string }
}

// ─── USER CONTEXT (status) ────────────────────────────────────────────────────

/**
 * Contexto mínimo del usuario autenticado.
 * Retornado por GET /status/user-context en <300ms.
 */
export interface UserContext {
  id: string
  name: string
  role: UserRole
  org_id: string
  org_name: string
  work_location_id: string | null
  work_location_name: string | null
}

// ─── FIRMA ELECTRÓNICA ────────────────────────────────────────────────────────

export type SignatureLinkStatus = 'SENT' | 'VIEWED' | 'SIGNED'
export type SignerType = 'INTERNAL' | 'EXTERNAL'
export type SignatureMode = 'STRICT' | 'FLEXIBLE'

/**
 * Firmante externo del catálogo reutilizable de una obra.
 * Retornado por GET /signatures/external-signers.
 */
export interface ExternalSigner {
  id: string
  org_id: string
  work_location_id: string
  name: string
  identification_number: string
  phone: string
  /** Sube foto de cédula y selfie en primer uso */
  is_registered: boolean
  created_at: string
  updated_at: string
}

/**
 * Estado de un token de firma (link enviado a externo).
 */
export interface SignatureTokenInfo {
  id: string
  token: string
  submission_id: string
  external_signer_id: string
  link_status: SignatureLinkStatus
  expires_at: string
  viewed_at: string | null
  used_at: string | null
  created_at: string
  external_signer?: ExternalSigner
}

/**
 * Estado de firma por firmante en un submission.
 * Retornado por GET /signatures/submissions/:submissionId/status.
 */
export interface SignatureStatusEntry {
  signer_type: SignerType
  /** Presente si es firmante interno */
  internal_user_id: string | null
  /** Presente si es firmante externo */
  external_signer_id: string | null
  external_signer?: ExternalSigner
  link_status: SignatureLinkStatus | null
  signed_at: string | null
  /** Nombre para mostrar */
  display_name: string
}

/**
 * Configuración de firma por plantilla.
 * Retornado por GET /signatures/templates/:templateId/config.
 */
export interface SignatureConfig {
  id: string
  template_id: string
  signature_mode: SignatureMode
  min_reading_seconds: number
  requires_internal_sign: boolean
  created_at: string
  updated_at: string
}

/**
 * Un punto del trazo manuscrito.
 */
export interface StrokeVector {
  x: number
  y: number
  /** Timestamp en milisegundos */
  t: number
}

/**
 * Entrada del log de lectura por sección o pregunta.
 */
export interface ReadingLogEntry {
  section_or_field_id: string
  seconds_viewed: number
}

/**
 * Vista pública del documento para firmar.
 * Retornado por GET /public/signature/:token.
 */
export interface PublicSignatureView {
  /** Firmante externo destinatario del token */
  signer: ExternalSigner
  /** Nombre del documento / template */
  document_name: string
  /** Nombre de quien solicita la firma */
  requester_name: string
  /** Secciones del documento con sus preguntas/respuestas */
  sections: Array<{
    id: string
    name: string
    fields: Array<{
      id: string
      label: string
      value: string | null
    }>
  }>
  /** Si ya subió foto de cédula + selfie */
  identity_verified: boolean
  /** Segundos mínimos de lectura del documento completo */
  min_reading_seconds: number
  link_status: SignatureLinkStatus
}

export interface DatosFacturaExtraida {
  numero_factura: string | null
  fecha_factura: string | null
  proveedor: string | null
  nit_proveedor: string | null
  cliente: string | null
  documento_cliente: string | null
  ciudad: string | null
  moneda: string | null
  forma_pago: string | null
  items: Array<{
    codigo: string | null
    descripcion: string
    cantidad: number | null
    unidad: string | null
    valor_unitario: number | null
    valor_total: number | null
  }>
  subtotal: number | null
  total_iva: number | null
  total_factura: number | null
  observaciones: string | null
}
