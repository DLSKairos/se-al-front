import { Badge } from './Badge'
import { SubmissionStatus, FormTemplateStatus } from '@/types'

const submissionVariant: Record<SubmissionStatus, Parameters<typeof Badge>[0]['variant']> = {
  SUBMITTED: 'warning',
  APPROVED:  'success',
  REJECTED:  'danger',
  DRAFT:     'draft',
}

const submissionLabel: Record<SubmissionStatus, string> = {
  SUBMITTED: 'Pendiente',
  APPROVED:  'Aprobado',
  REJECTED:  'Rechazado',
  DRAFT:     'Borrador',
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={submissionVariant[status]}>{submissionLabel[status]}</Badge>
}

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
