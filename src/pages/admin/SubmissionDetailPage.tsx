import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useDownload } from '@/hooks/useDownload'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Building2,
  Hash,
  Download,
  ImageIcon,
  AlertTriangle,
  Users,
} from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  SubmissionStatusBadge,
} from '@/components/ui'
import type { FormSubmission, FormSubmissionValue, FormSignature } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import SignersPanel from '@/components/signature/SignersPanel'
import RejectSubmissionModal from '@/components/submissions/RejectSubmissionModal'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)
}

// ── Componentes internos ──────────────────────────────────────────────────────

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

  if (fieldValue.value_date != null) {
    return (
      <span className="text-sm text-[var(--off-white)]">
        {formatDate(fieldValue.value_date)}
      </span>
    )
  }

  if (fieldValue.value_number != null) {
    return (
      <span className="text-sm text-[var(--off-white)]">
        {fieldValue.value_number}
      </span>
    )
  }

  if (fieldValue.value_json != null) {
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

  if (fieldValue.value_text != null) {
    if (fieldValue.value_text.startsWith('data:image/')) {
      return (
        <div className="bg-white rounded-lg p-3 inline-block">
          <img
            src={fieldValue.value_text}
            alt="Firma"
            className="max-h-28 object-contain"
          />
        </div>
      )
    }
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

// ── FormSubmission extendido con campos de rechazo y auto-aprobación ──────────
// Estos campos vienen del backend pero no están en el tipo base todavía;
// los casteamos localmente para no tocar src/types.

interface SubmissionWithExtras extends FormSubmission {
  rejection_reason?: string | null
  auto_approved_at?: string | null
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { download, downloading } = useDownload()
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data: submission, isLoading, error, refetch } = useQuery<SubmissionWithExtras>({
    queryKey: QK.submissions.detail(id!),
    queryFn: () =>
      api
        .get<SubmissionWithExtras>(`/form-submissions/${id}`)
        .then((r) => r.data as SubmissionWithExtras),
    enabled: !!id,
  })

  if (isLoading) return <LoadingSpinner label="Cargando detalle..." />
  if (error || !submission)
    return (
      <ErrorMessage
        message="Error al cargar el envío"
        onRetry={() => refetch()}
      />
    )

  const hasValues     = submission.values && submission.values.length > 0
  const hasSignatures = submission.signatures && submission.signatures.length > 0

  // Puede rechazarse desde SUBMITTED o PENDING_SIGNATURES (según spec 4.4 y decisión 4)
  const canReject = submission.status === 'SUBMITTED' || submission.status === 'PENDING_SIGNATURES'

  const isAutoApproved = !!submission.auto_approved_at
  const rejectionReason = submission.rejection_reason ?? undefined

  return (
    <div className="flex flex-col gap-6">

      {/* Banner de rechazo ── visible solo cuando REJECTED y hay motivo */}
      {submission.status === 'REJECTED' && rejectionReason && (
        <div
          className="flex items-start gap-3 p-4 rounded-[var(--radius-glass-md)] bg-red-500/10 border border-red-500/25"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-red-300 font-['DM_Sans'] mb-0.5">
              Formulario rechazado
            </p>
            <p className="text-sm text-red-200/80 font-['DM_Sans']">{rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
                {submission.template?.name ?? 'Envío'}
              </h1>
              <SubmissionStatusBadge
                status={submission.status}
                autoApproved={isAutoApproved}
                rejectionReason={rejectionReason}
              />
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

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={downloading}
            onClick={() => download(`/form-exports/${id}/pdf`, `formulario-${id}.pdf`)}
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Descargando...' : 'Descargar PDF'}
          </Button>

          {/* Botón rechazar — solo cuando el estado lo permite. Sin botón "Aprobar" (aprobación solo automática) */}
          {canReject && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowRejectModal(true)}
            >
              <AlertTriangle className="w-4 h-4" />
              Rechazar
            </Button>
          )}
        </div>
      </div>

      {/* Información de contexto */}
      <div className="glass-card p-5">
        <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
          Información del envío
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

      {/* Firmantes requeridos — SignersPanel */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--signal-dim)] flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 text-[var(--signal)]" />
          </div>
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-sm">
            Firmantes requeridos
          </h2>
        </div>
        <SignersPanel
          submissionId={id!}
          workLocationId={submission.work_location_id}
          mobileView={false}
        />
      </div>

      {/* Valores del formulario */}
      {hasValues && (
        <div className="glass-card p-5">
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] mb-4 text-sm">
            Respuestas del formulario
          </h2>
          <div className="flex flex-col divide-y divide-white/5">
            {submission.values!
              .filter((fv) => {
                if (fv.field?.field_type === 'SIGNATURE') return false
                if (fv.value_text?.startsWith('data:image/')) return false
                return true
              })
              .map((fieldValue) => (
                <div key={fieldValue.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mb-1.5 uppercase tracking-wide">
                    {fieldValue.field?.label ?? fieldValue.field_id}
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

      {/* Firmas simples (FormSignature legacy) */}
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
            Este envío no contiene datos adicionales
          </p>
        </div>
      )}

      {/* Modal rechazar — usa RejectSubmissionModal del agente de aprobaciones */}
      <RejectSubmissionModal
        submissionId={id!}
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onRejected={() => refetch()}
      />
    </div>
  )
}
