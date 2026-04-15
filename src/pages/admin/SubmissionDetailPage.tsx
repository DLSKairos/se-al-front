import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Building2,
  Hash,
  CheckCircle,
  XCircle,
  Download,
  ImageIcon,
} from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  SubmissionStatusBadge,
  ConfirmModal,
  Modal,
  useToast,
} from '@/components/ui'
import { FormSubmission, FormSubmissionValue, FormSignature } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)
}

function FieldValueDisplay({ fieldValue }: { fieldValue: FormSubmissionValue }) {
  if (fieldValue.value_file) {
    const url = fieldValue.value_file
    if (isImageUrl(url)) {
      return (
        <div className="flex flex-col gap-2">
          <img
            src={url}
            alt="Archivo adjunto"
            className="max-w-xs max-h-48 rounded-lg object-contain border border-white/10"
          />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--signal)] hover:underline"
          >
            <Download className="w-3 h-3" />
            Descargar imagen
          </a>
        </div>
      )
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--signal)] hover:underline"
      >
        <Download className="w-3.5 h-3.5" />
        Descargar archivo
      </a>
    )
  }

  if (fieldValue.value_date !== null) {
    return (
      <span className="text-sm text-[var(--off-white)]">
        {formatDate(fieldValue.value_date)}
      </span>
    )
  }

  if (fieldValue.value_number !== null) {
    return (
      <span className="text-sm text-[var(--off-white)]">
        {fieldValue.value_number}
      </span>
    )
  }

  if (fieldValue.value_json !== null) {
    const content = fieldValue.value_json
    if (Array.isArray(content)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {content.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-[var(--signal-dim)] text-[var(--signal)] border border-[var(--signal)]/20"
            >
              {String(item)}
            </span>
          ))}
        </div>
      )
    }
    return (
      <pre className="text-xs text-[var(--off-white)] bg-white/5 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(content, null, 2)}
      </pre>
    )
  }

  if (fieldValue.value_text !== null) {
    return (
      <span className="text-sm text-[var(--off-white)] whitespace-pre-wrap">
        {fieldValue.value_text}
      </span>
    )
  }

  return <span className="text-sm text-[var(--muted)] italic">Sin valor</span>
}

function SignatureCard({ signature }: { signature: FormSignature }) {
  return (
    <div className="glass-card-md p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans']">
            {signature.signer_name}
          </p>
          {signature.signer_role && (
            <p className="text-xs text-[var(--muted)] mt-0.5">{signature.signer_role}</p>
          )}
          {signature.signer_doc && (
            <p className="text-xs text-[var(--muted)]">CC: {signature.signer_doc}</p>
          )}
        </div>
        <p className="text-xs text-[var(--muted)] whitespace-nowrap">
          {formatDateTime(signature.signed_at)}
        </p>
      </div>
      <div className="bg-white rounded-lg p-3 flex items-center justify-center min-h-[80px]">
        {signature.signature_url ? (
          <img
            src={signature.signature_url}
            alt={`Firma de ${signature.signer_name}`}
            className="max-h-20 object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface InfoRowProps {
  icon: React.ElementType
  label: string
  value: string
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[var(--signal-dim)] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[var(--signal)]" />
      </div>
      <div>
        <p className="text-xs text-[var(--muted)] font-['DM_Sans']">{label}</p>
        <p className="text-sm text-[var(--off-white)] font-['DM_Sans']">{value}</p>
      </div>
    </div>
  )
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: submission, isLoading, error, refetch } = useQuery({
    queryKey: QK.submissions.detail(id!),
    queryFn: () =>
      api.get<FormSubmission>(`/form-submissions/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: QK.submissions.detail(id!) })
    queryClient.invalidateQueries({ queryKey: ['submissions'] })
  }

  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/form-submissions/${id}/approve`),
    onSuccess: () => {
      toast.success('Submission aprobado correctamente')
      setShowApproveModal(false)
      invalidateQueries()
    },
    onError: () => {
      toast.error('Error al aprobar el submission')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      api.patch(`/form-submissions/${id}/reject`, reason ? { reason } : {}),
    onSuccess: () => {
      toast.success('Submission rechazado')
      setShowRejectModal(false)
      setRejectReason('')
      invalidateQueries()
    },
    onError: () => {
      toast.error('Error al rechazar el submission')
    },
  })

  if (isLoading) return <LoadingSpinner label="Cargando detalle..." />
  if (error || !submission)
    return (
      <ErrorMessage
        message="Error al cargar el submission"
        onRetry={() => refetch()}
      />
    )

  const hasValues = submission.values && submission.values.length > 0
  const hasSignatures = submission.signatures && submission.signatures.length > 0
  const canAct = submission.status === 'SUBMITTED'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/submissions')}
            aria-label="Volver a submissions"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
                {submission.template?.name ?? 'Submission'}
              </h1>
              <SubmissionStatusBadge status={submission.status} />
            </div>
            <p className="text-sm text-[var(--muted)] mt-1 font-['DM_Sans']">
              Enviado por{' '}
              <span className="text-[var(--off-white)]">
                {submission.submitter?.name ?? submission.submitted_by}
              </span>{' '}
              el {formatDateTime(submission.submitted_at)}
            </p>
          </div>
        </div>

        {canAct && (
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowApproveModal(true)}
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </Button>
          </div>
        )}
      </div>

      {/* Información de contexto */}
      <div className="glass-card p-5">
        <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
          Información del submission
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoRow
            icon={User}
            label="Usuario"
            value={submission.submitter?.name ?? submission.submitted_by}
          />
          <InfoRow
            icon={Building2}
            label="Obra"
            value={submission.work_location?.name ?? '—'}
          />
          <InfoRow
            icon={Calendar}
            label="Fecha de envío"
            value={formatDateTime(submission.submitted_at)}
          />
          {submission.period_key && (
            <InfoRow
              icon={Hash}
              label="Periodo"
              value={submission.period_key}
            />
          )}
          {submission.geo_lat !== null && submission.geo_lng !== null && (
            <InfoRow
              icon={MapPin}
              label="Coordenadas GPS"
              value={`${submission.geo_lat.toFixed(6)}, ${submission.geo_lng.toFixed(6)}`}
            />
          )}
        </div>
      </div>

      {/* Valores del formulario */}
      {hasValues && (
        <div className="glass-card p-5">
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
            Respuestas del formulario
          </h2>
          <div className="flex flex-col divide-y divide-white/5">
            {submission.values!.map((fieldValue) => (
              <div key={fieldValue.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mb-1.5 uppercase tracking-wide">
                  {fieldValue.field_id}
                </p>
                <FieldValueDisplay fieldValue={fieldValue} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Datos raw si no hay values estructurados */}
      {!hasValues && Object.keys(submission.data).length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
            Datos del formulario
          </h2>
          <div className="flex flex-col divide-y divide-white/5">
            {Object.entries(submission.data).map(([key, value]) => (
              <div key={key} className="py-4 first:pt-0 last:pb-0">
                <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mb-1.5 uppercase tracking-wide">
                  {key}
                </p>
                <p className="text-sm text-[var(--off-white)] whitespace-pre-wrap">
                  {typeof value === 'object'
                    ? JSON.stringify(value, null, 2)
                    : String(value ?? '—')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Firmas */}
      {hasSignatures && (
        <div className="glass-card p-5">
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
            Firmas ({submission.signatures!.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {submission.signatures!.map((sig) => (
              <SignatureCard key={sig.id} signature={sig} />
            ))}
          </div>
        </div>
      )}

      {/* Sin contenido */}
      {!hasValues && Object.keys(submission.data).length === 0 && !hasSignatures && (
        <div className="glass-card p-10 text-center">
          <p className="text-[var(--muted)] text-sm font-['DM_Sans']">
            Este submission no contiene datos adicionales
          </p>
        </div>
      )}

      {/* Modal confirmar aprobación */}
      <ConfirmModal
        open={showApproveModal}
        onOpenChange={setShowApproveModal}
        title="Aprobar submission"
        description="Al aprobar este submission se notificará al usuario y quedará registrado. Esta acción no se puede deshacer."
        confirmLabel="Aprobar"
        variant="warning"
        loading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate()}
      />

      {/* Modal rechazar con razón */}
      <Modal
        open={showRejectModal}
        onOpenChange={(open) => {
          setShowRejectModal(open)
          if (!open) setRejectReason('')
        }}
        title="Rechazar submission"
        description="Opcionalmente puedes indicar el motivo del rechazo."
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="reject-reason"
              className="block text-sm text-[var(--muted)] font-['DM_Sans'] mb-1.5"
            >
              Motivo del rechazo (opcional)
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Describe el motivo del rechazo..."
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all resize-none placeholder:text-[var(--muted)]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
              disabled={rejectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate(rejectReason)}
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
