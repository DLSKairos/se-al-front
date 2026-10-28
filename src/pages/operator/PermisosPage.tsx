import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ClipboardList } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { FormTemplate } from '@/types'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'
import { TemplateIcon } from '@/components/ui/TemplateIcon'
import { SOSButton } from '@/components/ui/SOSButton'
import { usePageTitle } from '@/hooks/usePageTitle'

export function frequencyLabel(freq: string) {
  const map: Record<string, string> = {
    DAILY: 'Diario',
    WEEKLY: 'Semanal',
    PER_EVENT: 'Por evento',
    ONCE: 'Una vez',
    MONTHLY: 'Mensual',
  }
  return map[freq] ?? 'Cuando aplique'
}

export default function PermisosPage() {
  usePageTitle('Permisos')

  const navigate = useNavigate()

  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: QK.templates.active(),
    queryFn: () => api.get<FormTemplate[]>('/form-templates').then((r) => r.data),
  })

  return (
    <div
      className="min-h-screen bg-[var(--navy)] flex flex-col pb-24 overflow-x-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-5 pb-2">
        <h1 className="font-display font-extrabold text-[44px] leading-[0.95] text-[var(--fg)] pt-12">
          Permisos
        </h1>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        {isLoading && <LoadingSpinner label="Cargando permisos..." />}

        {!isLoading && error && (
          <ErrorMessage message="No se pudieron cargar los permisos" onRetry={() => refetch()} />
        )}

        {!isLoading && !error && templates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-[var(--muted)]" />
            </div>
            <p className="text-sm text-[var(--muted)] font-dm text-center">
              No hay permisos disponibles en este momento
            </p>
          </div>
        )}

        {!isLoading && !error && templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => navigate(`/form/${template.id}`)}
            className="w-full min-w-0 flex items-center gap-4 p-5 glass rounded-[20px] hover:border-[color:var(--line-strong)] transition-all text-left active:scale-[0.98] overflow-hidden"
          >
            <div className="w-12 h-12 rounded-[14px] bg-[var(--brand)] text-[var(--on-brand)] flex items-center justify-center text-2xl shrink-0 border border-white/5">
              <TemplateIcon icon={template.icon} className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold text-[var(--off-white)] truncate mb-1">
                {template.name}
              </p>
              {template.description && (
                <p className="text-xs text-[var(--muted)] font-dm line-clamp-2 mb-1.5">
                  {template.description}
                </p>
              )}
              <span className="text-[12px] font-bold px-2.5 py-1 rounded bg-[var(--wash-brand)] text-[var(--accent-ink)] border border-[color:var(--line-strong)]">
                {frequencyLabel(template.data_frequency)}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
          </button>
        ))}
      </div>

      <SOSButton />
    </div>
  )
}
