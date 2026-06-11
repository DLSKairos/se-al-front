export const QK = {
  templates: {
    admin:  () => ['form-templates', 'admin'] as const,
    active: () => ['form-templates', 'active'] as const,
    detail: (id: string) => ['form-templates', id] as const,
    fields: (id: string) => ['form-templates', id, 'fields'] as const,
    context: (id: string) => ['form-templates', id, 'context'] as const,
  },
  submissions: {
    all:    () => ['submissions'] as const,
    list:   (filters: object) => ['submissions', filters] as const,
    stats:  (filters: object) => ['submissions', 'stats', filters] as const,
    detail: (id: string)      => ['submissions', id] as const,
    signatures: (id: string)  => ['submissions', id, 'signatures'] as const,
  },
  users:         () => ['users'] as const,
  workLocations: (all?: boolean) => ['work-locations', all] as const,
  departments:   () => ['departments'] as const,
  categories:    () => ['form-categories'] as const,
  attendance: {
    list:   (filters: object) => ['attendance', filters] as const,
    today:  ()                => ['attendance', 'today'] as const,
    config: ()                => ['attendance', 'config'] as const,
    open:   ()                => ['attendance', 'open'] as const,
  },
  /** NOTA: Esta key pre-existente aplica a notificaciones de plantilla (FormNotification).
   *  Las nuevas keys de AppNotification están en QK.appNotifications. */
  notifications: (templateId: string) => ['form-notifications', templateId] as const,
  webhooks:  () => ['webhooks'] as const,
  orgs:      () => ['organizations'] as const,
  blueprints: {
    list: (filters?: { category?: string; search?: string }) =>
      ['blueprints', 'list', filters] as const,
    detail: (id: string) => ['blueprints', id] as const,
  },
  inventarios: {
    all: ['inventarios'] as const,
    sesiones: () => [...QK.inventarios.all, 'sesiones'] as const,
    sesion: (id: string) => [...QK.inventarios.all, 'sesion', id] as const,
  },
  reverseGeocode: (lat: number, lng: number) => ['reverse-geocode', lat, lng] as const,

  // ── Sprint: nuevas keys ────────────────────────────────────────────────────

  /** Notificaciones in-app del usuario (AppNotification) */
  appNotifications: {
    list:   (params?: { unreadOnly?: boolean; page?: number }) =>
      ['app-notifications', 'list', params] as const,
    unread: () => ['app-notifications', 'unread'] as const,
  },

  /** Feature flags del sistema */
  featureFlags: () => ['feature-flags'] as const,

  /** Firma electrónica */
  signatures: {
    /** Estado de firmas de un submission: [ lista de SignatureStatusEntry ] */
    status: (submissionId: string) =>
      ['signatures', 'status', submissionId] as const,
    /** Firmantes externos de una obra */
    externalSigners: (workLocationId: string) =>
      ['signatures', 'external-signers', workLocationId] as const,
    /** Config de firma de una plantilla */
    config: (templateId: string) =>
      ['signatures', 'config', templateId] as const,
    /** Vista pública del documento por token de firma */
    publicView: (token: string) =>
      ['signatures', 'public-view', token] as const,
  },

  /** Submissions en el panel admin con filtro de estado */
  adminSubmissions: (params?: { status?: string; page?: number }) =>
    ['admin-submissions', params] as const,

  /** SuperAdmin */
  superadmin: {
    orgs:      () => ['superadmin', 'orgs'] as const,
    org:       (id: string) => ['superadmin', 'org', id] as const,
    usage:     (id: string) => ['superadmin', 'usage', id] as const,
    mlHistory: (orgId: string) => ['superadmin', 'ml-history', orgId] as const,
    featureFlags: () => ['superadmin', 'feature-flags'] as const,
  },

  /** Administradores de la organización */
  administrators: () => ['administrators'] as const,

  /** Listas maestras */
  masterLists: {
    positions:  () => ['master-lists', 'positions'] as const,
    roles:      () => ['master-lists', 'roles'] as const,
    departments: () => ['master-lists', 'departments'] as const,
    /** Sugerencias pendientes (solo admin) */
    suggestions: () => ['master-lists', 'suggestions'] as const,
  },

  /** Contexto mínimo del usuario (status/user-context) */
  userContext: () => ['user-context'] as const,
}
