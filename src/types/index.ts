// ── Auth ──────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR'

export interface JWTPayload {
  sub: string
  orgId: string
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
  options: Array<{ label: string; value: string }> | null
  validations: Record<string, unknown> | null
  revalidation_frequency: Frequency
}

// ── Form Submissions ──────────────────────────────
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

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

export interface AIAssistResult {
  action: 'update_sections' | 'add_field' | 'set_columns' | 'none'
  payload: any
  message?: string
  aiError?: boolean
}
