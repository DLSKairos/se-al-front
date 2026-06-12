import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import { Button, LoadingSpinner, ErrorMessage, useToast } from '@/components/ui'
import api from '@/lib/api'
import { signaturesApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import SignatureCanvas from '@/components/signature/SignatureCanvas'
import EvidenceSummaryModal from '@/components/signature/EvidenceSummaryModal'
import { useReadingTracker } from '@/components/signature/useReadingTracker'
import { useGeolocation } from '@/components/signature/useGeolocation'
import VerifyingOverlay from '@/components/ui/VerifyingOverlay'
import type { FormSubmission, StrokeVector } from '@/types'

// ── Tiempo mínimo de lectura por defecto (segundos) ──────────────────────────
const DEFAULT_MIN_SECONDS = 30

// ── Sección del documento en modo lectura ────────────────────────────────────

interface DocumentSectionProps {
  section: { id: string; title: string; entries: Array<{ label: string; value: string }> }
  isCurrent: boolean
  isCompleted: boolean
}

function DocumentSection({ section, isCompleted }: DocumentSectionProps) {
  return (
    <div
      className={`rounded-[var(--radius-glass-md)] border p-4 transition-colors ${
        isCompleted
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-white/5 border-white/8'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--off-white)] font-['Syne']">
          {section.title}
        </h3>
        {isCompleted && (
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        {section.entries.map((entry, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <span className="text-xs text-[var(--muted)] font-['DM_Sans'] uppercase tracking-wide">
              {entry.label}
            </span>
            <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
              {entry.value || <em className="text-[var(--muted)]">Sin respuesta</em>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Paso de lectura del documento ─────────────────────────────────────────────

interface ReadingViewProps {
  submission: FormSubmission
  onComplete: (readingLog: Array<{ section_or_field_id: string; seconds_viewed: number }>) => void
}

function ReadingView({ submission, onComplete }: ReadingViewProps) {
  const { startSection, stopSection, getLog, getSecondsForSection } = useReadingTracker()
  const [elapsed, setElapsed] = useState(0)
  const minSeconds = DEFAULT_MIN_SECONDS

  // Construir secciones a partir de los values del submission
  const sections = (() => {
    if (!submission.values || submission.values.length === 0) {
      return [{
        id: 'main',
        title: submission.template?.name ?? 'Documento',
        entries: Object.entries(submission.data).map(([k, v]) => ({
          label: k,
          value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
        })),
      }]
    }

    // Agrupar por sección si hay fields; un solo grupo si no
    const sectionId = 'main-section'
    return [{
      id: sectionId,
      title: submission.template?.name ?? 'Documento',
      entries: submission.values
        .filter((fv) => fv.field?.field_type !== 'SIGNATURE' && !fv.value_text?.startsWith('data:image/'))
        .map((fv) => ({
          label: fv.field?.label ?? fv.field_id,
          value: fv.value_text ?? (fv.value_number != null ? String(fv.value_number) : ''),
        })),
    }]
  })()

  const singleSectionId = sections[0].id
  const secondsInSection = getSecondsForSection(singleSectionId)
  const canProceed = secondsInSection >= minSeconds

  useEffect(() => {
    startSection(singleSectionId)
    return () => stopSection()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getSecondsForSection(singleSectionId))
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleContinue = () => {
    stopSection()
    onComplete(getLog())
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Contador de lectura */}
      <div className="sticky top-0 z-10 py-2 bg-[var(--navy)] border-b border-white/5">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-['DM_Sans'] font-medium ${
              canProceed ? 'text-emerald-400' : 'text-[var(--signal)]'
            }`}
          >
            <Clock className="w-4 h-4" />
            {canProceed
              ? 'Documento leído — puedes firmar'
              : `Leyendo documento: ${formatTime(elapsed)}`}
          </span>
          {!canProceed && (
            <span className="text-xs text-[var(--muted)] font-['DM_Sans'] tabular-nums">
              {formatTime(Math.max(minSeconds - elapsed, 0))} restantes
            </span>
          )}
        </div>
        {/* Barra de progreso de lectura */}
        <div className="mt-2 w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00D4FF, #0096b3)' }}
            animate={{ width: `${Math.min((elapsed / minSeconds) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Documento */}
      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <DocumentSection
            key={section.id}
            section={section}
            isCurrent
            isCompleted={canProceed}
          />
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full min-h-[56px] text-base mt-2"
        disabled={!canProceed}
        onClick={handleContinue}
      >
        Ir a firmar
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}

// ── Paso de firma ─────────────────────────────────────────────────────────────

interface SigningViewProps {
  submissionId: string
  readingLog: Array<{ section_or_field_id: string; seconds_viewed: number }>
  onComplete: () => void
}

function SigningView({ submissionId, readingLog, onComplete }: SigningViewProps) {
  const toast = useToast()
  const { position, status: geoStatus, error: geoError, request: requestGeo } = useGeolocation()
  const [pendingSignature, setPendingSignature] = useState<{
    vectors: StrokeVector[]
    imageBase64: string
  } | null>(null)
  const [showEvidence, setShowEvidence] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    requestGeo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCanvasConfirm = (result: { vectors: StrokeVector[]; imageBase64: string }) => {
    setPendingSignature(result)
    setShowEvidence(true)
  }

  const handleFinalConfirm = async () => {
    if (!pendingSignature) return
    setIsSending(true)
    try {
      await signaturesApi.signInternal(submissionId, {
        stroke_vectors: pendingSignature.vectors,
        stroke_image_base64: pendingSignature.imageBase64,
        geo_lat: position?.lat ?? 0,
        geo_lng: position?.lng ?? 0,
        geo_accuracy: position?.accuracy,
        reading_log: readingLog,
        webauthn_session_active: true,
      })
      setShowEvidence(false)
      onComplete()
    } catch {
      toast.error('Error al registrar la firma. Intenta de nuevo.')
      setPendingSignature(null)
      setShowEvidence(false)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="relative flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--off-white)] font-['Syne'] mb-2">
          Tu firma
        </h2>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          Traza tu firma para registrarla en el documento.
        </p>
      </div>

      {geoStatus === 'loading' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-input)] bg-[var(--signal-dim)] border border-[var(--signal)]/20">
          <span className="w-3 h-3 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--signal)] font-['DM_Sans']">
            Obteniendo ubicación...
          </span>
        </div>
      )}
      {(geoStatus === 'denied' || geoStatus === 'error') && geoError && (
        <div className="p-3 rounded-[var(--radius-input)] bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400 font-['DM_Sans']">{geoError}</p>
        </div>
      )}

      <SignatureCanvas
        onConfirm={handleCanvasConfirm}
        disabled={geoStatus === 'loading'}
      />

      <VerifyingOverlay
        visible={isSending}
        variant="partial"
        message="Registrando tu firma..."
      />

      <EvidenceSummaryModal
        open={showEvidence}
        onClose={() => {
          setShowEvidence(false)
          setPendingSignature(null)
        }}
        onConfirm={handleFinalConfirm}
        loading={isSending}
        position={position}
      />
    </div>
  )
}

// ── Pantalla de éxito ─────────────────────────────────────────────────────────

function SuccessView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-6 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
      >
        <CheckCircle className="w-10 h-10 text-emerald-400" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-[var(--off-white)] font-['Syne'] mb-2">
          ¡Firma registrada!
        </h2>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          Tu firma quedó registrada en el documento.
        </p>
      </div>

      <Button
        variant="secondary"
        size="lg"
        className="min-h-[52px] px-8"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>
    </motion.div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

type Step = 'reading' | 'signing' | 'success'

/**
 * Página de firma interna del operario autenticado.
 * Ruta: /firmar/:submissionId
 * Muestra el documento con contador de lectura, luego canvas de firma.
 */
export default function InternalSignaturePage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('reading')
  const [readingLog, setReadingLog] = useState<
    Array<{ section_or_field_id: string; seconds_viewed: number }>
  >([])

  const { data: submission, isLoading, error, refetch } = useQuery<FormSubmission>({
    queryKey: QK.submissions.detail(submissionId!),
    queryFn: () =>
      api.get<FormSubmission>(`/form-submissions/${submissionId}`).then(
        (r) => r.data as FormSubmission,
      ),
    enabled: !!submissionId,
  })

  if (isLoading) return <LoadingSpinner label="Cargando documento..." fullscreen />
  if (error || !submission)
    return (
      <ErrorMessage
        message="Error al cargar el documento"
        onRetry={() => refetch()}
      />
    )

  const handleReadingComplete = (
    log: Array<{ section_or_field_id: string; seconds_viewed: number }>,
  ) => {
    setReadingLog(log)
    setStep('signing')
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[var(--navy-mid)]">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-btn)] hover:bg-white/5 text-[var(--muted)] transition-colors"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-[var(--off-white)] font-['Syne'] truncate">
            {submission.template?.name ?? 'Firmar documento'}
          </h1>
          <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
            Firma electrónica — Ley 527/1999
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 'reading' && (
            <motion.div
              key="reading"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ReadingView
                submission={submission}
                onComplete={handleReadingComplete}
              />
            </motion.div>
          )}

          {step === 'signing' && (
            <motion.div
              key="signing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SigningView
                submissionId={submissionId!}
                readingLog={readingLog}
                onComplete={() => setStep('success')}
              />
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <SuccessView onBack={() => navigate(-1)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
