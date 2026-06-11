import { CheckCircle, Zap } from 'lucide-react'
import { Badge } from './Badge'
import { SubmissionStatus, FormTemplateStatus } from '@/types'

// ── SubmissionStatusBadge ────────────────────────────────────────────────────

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus
  /** Solo relevante para APPROVED: si fue aprobado automáticamente */
  autoApproved?: boolean
  /** Solo relevante para REJECTED: motivo del rechazo (muestra en title) */
  rejectionReason?: string
}

const submissionVariant: Record<SubmissionStatus, Parameters<typeof Badge>[0]['variant']> = {
  SUBMITTED:          'info',
  PENDING_SIGNATURES: 'warning',
  APPROVED:           'success',
  REJECTED:           'danger',
  DRAFT:              'draft',
}

const submissionLabel: Record<SubmissionStatus, string> = {
  SUBMITTED:          'Enviado',
  PENDING_SIGNATURES: 'En revisión',
  APPROVED:           'Aprobado',
  REJECTED:           'Rechazado',
  DRAFT:              'Borrador',
}

export function SubmissionStatusBadge({
  status,
  autoApproved = false,
  rejectionReason,
}: SubmissionStatusBadgeProps) {
  const variant = submissionVariant[status]
  const label   = submissionLabel[status]

  // Título para accesibilidad (tooltip nativo en desktop)
  let titleText: string | undefined

  if (status === 'APPROVED' && autoApproved) {
    titleText = 'Aprobado automáticamente: todos los campos y firmas completos'
  } else if (status === 'PENDING_SIGNATURES') {
    titleText = 'Flujo de firmas incompleto'
  } else if (status === 'REJECTED' && rejectionReason) {
    titleText = `Motivo de rechazo: ${rejectionReason}`
  }

  return (
    <Badge variant={variant} className="gap-1" title={titleText}>
      {/* Ícono check para APPROVED */}
      {status === 'APPROVED' && (
        <CheckCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
      )}

      {label}

      {/* Indicador "auto" solo en APPROVED automático */}
      {status === 'APPROVED' && autoApproved && (
        <Zap
          className="w-3 h-3 shrink-0 text-emerald-300"
          aria-hidden="true"
          title="Aprobado automáticamente"
        />
      )}
    </Badge>
  )
}

// ── TemplateStatusBadge ──────────────────────────────────────────────────────

const templateVariant: Record<FormTemplateStatus, Parameters<typeof Badge>[0]['variant']> = {
  ACTIVE:   'success',
  DRAFT:    'draft',
  ARCHIVED: 'danger',
}

const templateLabel: Record<FormTemplateStatus, string> = {
  ACTIVE:   'Activo',
  DRAFT:    'Borrador',
  ARCHIVED: 'Archivado',
}

export function TemplateStatusBadge({ status }: { status: FormTemplateStatus }) {
  return <Badge variant={templateVariant[status]}>{templateLabel[status]}</Badge>
}
