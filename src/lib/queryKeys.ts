export const QK = {
  templates: {
    admin:  () => ['form-templates', 'admin'] as const,
    active: () => ['form-templates', 'active'] as const,
    detail: (id: string) => ['form-templates', id] as const,
    fields: (id: string) => ['form-templates', id, 'fields'] as const,
    context: (id: string) => ['form-templates', id, 'context'] as const,
  },
  submissions: {
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
  notifications: (templateId: string) => ['notifications', templateId] as const,
  webhooks:  () => ['webhooks'] as const,
  orgs:      () => ['organizations'] as const,
  blueprints: {
    list: (filters?: { category?: string; search?: string }) =>
      ['blueprints', 'list', filters] as const,
    detail: (id: string) => ['blueprints', id] as const,
  },
}
