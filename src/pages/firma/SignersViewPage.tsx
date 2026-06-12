import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import SignersPanel from '@/components/signature/SignersPanel'
import { useAuthStore } from '@/stores/authStore'
import type { FormSubmission } from '@/types'

/**
 * Vista móvil grande de gestión de firmantes para el operario.
 * Ruta autenticada: /firmantes/:submissionId
 */
export default function SignersViewPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const workLocationId = useAuthStore((s) => s.workLocationId)

  const { data: submission, isLoading, error, refetch } = useQuery<FormSubmission>({
    queryKey: QK.submissions.detail(submissionId!),
    queryFn: () =>
      api
        .get<FormSubmission>(`/form-submissions/${submissionId}`)
        .then((r) => r.data as FormSubmission),
    enabled: !!submissionId,
  })

  if (isLoading) return <LoadingSpinner label="Cargando firmantes..." fullscreen />
  if (error || !submission)
    return (
      <ErrorMessage
        message="Error al cargar el formulario"
        onRetry={() => refetch()}
      />
    )

  const effectiveLocationId = workLocationId ?? submission.work_location_id

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[var(--navy-mid)]">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-btn)] hover:bg-white/5 text-[var(--muted)] transition-colors"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-[var(--off-white)] font-['Syne'] truncate">
            Firmantes
          </h1>
          <p className="text-xs text-[var(--muted)] font-['DM_Sans'] truncate">
            {submission.template?.name ?? 'Documento'}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        <p className="text-sm text-[var(--muted)] font-['DM_Sans'] mb-5">
          Agrega firmantes externos y envíales el link por WhatsApp para que firmen el documento.
        </p>

        <SignersPanel
          submissionId={submissionId!}
          workLocationId={effectiveLocationId}
          mobileView
        />
      </div>
    </div>
  )
}
