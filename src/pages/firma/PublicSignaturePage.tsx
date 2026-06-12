import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronRight, Clock, AlertTriangle, Camera, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { publicSignatureApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import SignatureCanvas from '@/components/signature/SignatureCanvas'
import EvidenceSummaryModal from '@/components/signature/EvidenceSummaryModal'
import { useReadingTracker } from '@/components/signature/useReadingTracker'
import { useGeolocation } from '@/components/signature/useGeolocation'
import VerifyingOverlay from '@/components/ui/VerifyingOverlay'
import type { StrokeVector, PublicSignatureView } from '@/types'

// ── Pantallas de error ────────────────────────────────────────────────────

type TokenErrorCode = 'TOKEN_EXPIRED' | 'TOKEN_USED' | 'TOKEN_INVALID'

function TokenErrorScreen({ code }: { code: TokenErrorCode }) {
  const messages: Record<TokenErrorCode, { title: string; body: string }> = {
    TOKEN_EXPIRED: {
      title: 'El link de firma expiró',
      body: 'Este link de firma tenía un tiempo de validez de 2 horas y ya venció. Comunícate con quien te lo envió para que genere un nuevo link.',
    },
    TOKEN_USED: {
      title: 'Este documento ya fue firmado',
      body: 'La firma de este documento ya fue registrada anteriormente. Si crees que hay un error, comunícate con quien te envió el link.',
    },
    TOKEN_INVALID: {
      title: 'Link no válido',
      body: 'Este link no corresponde a ningún documento pendiente de firma. Verifica que hayas abierto el link correcto.',
    },
  }

  const { title, body } = messages[code]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 text-center"
      style={{ background: '#0C1624' }}>
      <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-[var(--off-white)] font-['Syne'] mb-2">{title}</h1>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans'] max-w-xs">{body}</p>
      </div>
      <div className="mt-4 px-4 py-3 rounded-[var(--radius-input)] bg-white/5 border border-white/10 max-w-xs">
        <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
          Powered by{' '}
          <span className="text-[var(--signal)] font-semibold">SEÑAL</span>
        </p>
      </div>
    </div>
  )
}

// ── Paso de Identificación (foto cédula + selfie) ─────────────────────────

interface CaptureButtonProps {
  label: string
  preview: string | null
  inputId: string
  captureMode: 'user' | 'environment'
  onChange: (file: File) => void
}

/**
 * Botón de captura de foto para cédula o selfie.
 * Definido a nivel de módulo para evitar remount en cada render de IdentityStep.
 */
function CaptureButton({ label, preview, inputId, captureMode, onChange }: CaptureButtonProps) {
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={inputId} className="block">
        {preview ? (
          <div className="relative rounded-[var(--radius-glass-md)] overflow-hidden border-2 border-[var(--signal)]/30">
            <img
              src={preview}
              alt={`Vista previa ${label}`}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-center pb-3">
              <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full font-['DM_Sans'] flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Retomar
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-glass-md)] border-2 border-dashed border-[rgba(0,212,255,0.3)] bg-white/3 py-8 cursor-pointer hover:border-[var(--signal)]/60 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[var(--signal-dim)] flex items-center justify-center">
              <Camera className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <p className="text-sm text-[var(--off-white)] font-['DM_Sans'] text-center">
              {label}
            </p>
            <p className="text-xs text-[var(--muted)] font-['DM_Sans']">Toca para tomar la foto</p>
          </div>
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture={captureMode}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onChange(file)
        }}
      />
    </div>
  )
}

interface IdentityStepProps {
  token: string
  onComplete: () => void
}

function IdentityStep({ token, onComplete }: IdentityStepProps) {
  const [cedula, setCedula] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [cedulaPreview, setCedulaPreview] = useState<string | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFile = (file: File, type: 'cedula' | 'selfie') => {
    const url = URL.createObjectURL(file)
    if (type === 'cedula') {
      setCedula(file)
      setCedulaPreview(url)
    } else {
      setSelfie(file)
      setSelfiePreview(url)
    }
  }

  const handleUpload = async () => {
    if (!cedula || !selfie) return
    setUploading(true)
    setUploadError(null)
    try {
      await publicSignatureApi.uploadIdentity(token, cedula, selfie)
      onComplete()
    } catch {
      setUploadError('Error al subir las fotos. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header paso */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--signal-dim)] text-[var(--signal)] text-xs font-['DM_Sans'] mb-3">
          <span>Paso 1 de 3</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--off-white)] font-['Syne'] mb-2">
          Verifica tu identidad
        </h2>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          Necesitamos una foto de tu cédula y una selfie para confirmar que eres tú quien firma.
        </p>
      </div>

      <CaptureButton
        label="Foto de la cédula (parte frontal)"
        preview={cedulaPreview}
        inputId="cedula-input"
        captureMode="environment"
        onChange={(file) => handleFile(file, 'cedula')}
      />

      <CaptureButton
        label="Selfie — mira directo a la cámara"
        preview={selfiePreview}
        inputId="selfie-input"
        captureMode="user"
        onChange={(file) => handleFile(file, 'selfie')}
      />

      {uploadError && (
        <div className="p-3 rounded-[var(--radius-input)] bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 font-['DM_Sans']">{uploadError}</p>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full min-h-[56px] text-base"
        disabled={!cedula || !selfie}
        loading={uploading}
        onClick={handleUpload}
      >
        Continuar
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}

// ── Paso de lectura del documento ─────────────────────────────────────────

interface ReadingStepProps {
  view: PublicSignatureView
  onComplete: () => void
}

function ReadingStep({ view, onComplete }: ReadingStepProps) {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [elapsedDisplay, setElapsedDisplay] = useState(0)
  const { startSection, stopSection, getLog, getSecondsForSection } = useReadingTracker()

  const currentSection = view.sections[currentSectionIdx]
  const isLastSection = currentSectionIdx === view.sections.length - 1
  const minSecondsPerSection = Math.floor(
    view.min_reading_seconds / Math.max(view.sections.length, 1)
  )
  const secondsInCurrent = getSecondsForSection(currentSection?.id ?? '')
  const canContinue = secondsInCurrent >= minSecondsPerSection

  // Iniciar tracker cuando cambia la sección
  useEffect(() => {
    if (!currentSection) return
    startSection(currentSection.id)
    return () => stopSection()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSectionIdx])

  // Contador de tiempo en pantalla
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedDisplay(getSecondsForSection(currentSection?.id ?? ''))
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSectionIdx])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleNext = () => {
    if (isLastSection) {
      stopSection()
      onComplete()
    } else {
      setCurrentSectionIdx((i) => i + 1)
      setElapsedDisplay(0)
    }
  }

  const progress = ((currentSectionIdx) / view.sections.length) * 100

  if (!currentSection) return null

  return (
    <div className="flex flex-col gap-5">
      {/* Progreso */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[var(--muted)] font-['DM_Sans']">
            Sección {currentSectionIdx + 1} de {view.sections.length}
          </span>
          {/* Contador de lectura */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-['DM_Sans'] font-medium ${
              canContinue ? 'text-emerald-400' : 'text-[var(--signal)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {canContinue ? 'Listo para continuar' : `Leyendo: ${formatTime(elapsedDisplay)}`}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00D4FF, #0096b3)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Contador mínimo */}
      {!canContinue && (
        <div className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-input)] bg-[var(--signal-dim)] border border-[var(--signal)]/20">
          <span className="text-xs text-[var(--signal)] font-['DM_Sans']">
            Lee el documento completo ({minSecondsPerSection}s mínimo por sección)
          </span>
          <span className="text-xs text-[var(--signal)] font-['DM_Sans'] font-bold tabular-nums">
            {formatTime(Math.max(minSecondsPerSection - elapsedDisplay, 0))}
          </span>
        </div>
      )}

      {/* Contenido de la sección */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSectionIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4"
        >
          <h3 className="text-lg font-bold text-[var(--off-white)] font-['Syne']">
            {currentSection.name}
          </h3>

          <div className="flex flex-col gap-3">
            {currentSection.fields.map((field) => (
              <div
                key={field.id}
                className="p-3 rounded-[var(--radius-glass-md)] bg-white/5 border border-white/8"
              >
                <p className="text-xs text-[var(--muted)] font-['DM_Sans'] uppercase tracking-wide mb-1">
                  {field.label}
                </p>
                <p className="text-sm text-[var(--off-white)] font-['DM_Sans']">
                  {field.value ?? <em className="text-[var(--muted)]">Sin respuesta</em>}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Botón continuar */}
      <Button
        variant="primary"
        size="lg"
        className="w-full min-h-[56px] text-base mt-2"
        disabled={!canContinue}
        onClick={handleNext}
      >
        {isLastSection ? 'Ir a firmar' : 'Continuar'}
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}

// ── Paso de firma ─────────────────────────────────────────────────────────

interface SigningStepProps {
  token: string
  view: PublicSignatureView
  onComplete: (signedAt: string) => void
}

function SigningStep({ token, view, onComplete }: SigningStepProps) {
  const { position, status: geoStatus, error: geoError, request: requestGeo } = useGeolocation()
  const [pendingSignature, setPendingSignature] = useState<{
    vectors: StrokeVector[]
    imageBase64: string
  } | null>(null)
  const [showEvidence, setShowEvidence] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { getLog } = useReadingTracker()

  // Solicitar geolocalización al montar
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
    setSubmitError(null)

    try {
      const readingLog = getLog()

      // Si no hay lectura en el log (se llegó aquí directamente), crear entrada mínima
      const finalLog = readingLog.length > 0
        ? readingLog
        : view.sections.map((s) => ({ section_or_field_id: s.id, seconds_viewed: 0 }))

      const response = await publicSignatureApi.sign(token, {
        stroke_vectors: pendingSignature.vectors,
        stroke_image_base64: pendingSignature.imageBase64,
        geo_lat: position?.lat ?? 0,
        geo_lng: position?.lng ?? 0,
        geo_accuracy: position?.accuracy,
        reading_log: finalLog,
      })

      onComplete(response.data.signed_at)
    } catch {
      setSubmitError('No se pudo registrar la firma. Revisa tu conexión e intenta de nuevo.')
      setPendingSignature(null)
      setShowEvidence(false)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--signal-dim)] text-[var(--signal)] text-xs font-['DM_Sans'] mb-3">
          <span>Paso 3 de 3</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--off-white)] font-['Syne'] mb-2">
          Tu firma
        </h2>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          Traza tu firma a continuación para finalizar.
        </p>
      </div>

      {/* Estado de geolocalización */}
      {geoStatus === 'loading' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-input)] bg-[var(--signal-dim)] border border-[var(--signal)]/20">
          <span className="w-3 h-3 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--signal)] font-['DM_Sans']">
            Obteniendo ubicación...
          </span>
        </div>
      )}
      {(geoStatus === 'denied' || geoStatus === 'error') && geoError && (
        <div className="flex flex-col gap-2 p-3 rounded-[var(--radius-input)] bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400 font-['DM_Sans']">{geoError}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={requestGeo}
            className="self-start text-amber-400 border-amber-500/30"
          >
            <RefreshCw className="w-3 h-3" />
            Reintentar
          </Button>
        </div>
      )}

      <SignatureCanvas
        onConfirm={handleCanvasConfirm}
        disabled={geoStatus === 'loading'}
      />

      {/* Error de envío */}
      {submitError && (
        <div className="flex flex-col gap-2 p-3 rounded-[var(--radius-input)] bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 font-['DM_Sans']">{submitError}</p>
          <button
            type="button"
            className="self-start text-xs text-red-400 underline font-['DM_Sans']"
            onClick={() => setSubmitError(null)}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* VerifyingOverlay parcial durante el envío */}
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

// ── Pantalla de éxito ─────────────────────────────────────────────────────

function SuccessScreen({ signedAt }: { signedAt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-6 py-10 text-center"
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
          ¡Documento firmado!
        </h2>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          Tu firma fue registrada correctamente.
        </p>
        <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-1">
          {new Date(signedAt).toLocaleString('es-CO')}
        </p>
      </div>

      <div className="mt-2 px-4 py-3 rounded-[var(--radius-input)] bg-white/5 border border-white/10 max-w-xs">
        <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
          Puedes cerrar esta ventana.
        </p>
      </div>

      <div className="mt-4">
        <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
          Powered by{' '}
          <span className="text-[var(--signal)] font-semibold">SEÑAL</span>
        </p>
      </div>
    </motion.div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────

type Step = 'welcome' | 'identity' | 'reading' | 'signing' | 'success'

export default function PublicSignaturePage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<Step>('welcome')
  const [signedAt, setSignedAt] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<TokenErrorCode | null>(null)

  const { data: view, isLoading, error } = useQuery<PublicSignatureView>({
    queryKey: QK.signatures.publicView(token!),
    queryFn: () => publicSignatureApi.getView(token!).then((r) => r.data as PublicSignatureView),
    enabled: !!token,
    retry: false,
  })

  // Determinar si tenemos error de token desde el status code
  useEffect(() => {
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (error as any)?.response?.data?.code
      if (['TOKEN_EXPIRED', 'TOKEN_USED', 'TOKEN_INVALID'].includes(code)) {
        setTokenError(code as TokenErrorCode)
      } else {
        setTokenError('TOKEN_INVALID')
      }
    }
  }, [error])

  // ── Renders de estados globales ───────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0C1624' }}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted)] font-['DM_Sans']">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (tokenError) {
    return <TokenErrorScreen code={tokenError} />
  }

  if (!view) return null

  // ── Pantalla de bienvenida ─────────────────────────────────────────────

  if (step === 'welcome') {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0C1624 0%, #111E30 100%)' }}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 max-w-sm mx-auto w-full">
          {/* Logo SEÑAL */}
          <div className="text-center">
            <span className="text-2xl font-bold font-['Syne']" style={{ color: '#00D4FF' }}>
              SEÑAL
            </span>
          </div>

          {/* Info del documento */}
          <div className="w-full text-center">
            <div className="w-16 h-16 rounded-[var(--radius-glass)] bg-[var(--signal-dim)] mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--signal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne'] mb-2 leading-tight">
              {view.document_name}
            </h1>
            <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
              <span className="text-[var(--off-white)]">{view.requester_name}</span> solicita tu firma en este documento.
            </p>
          </div>

          {/* Info del firmante */}
          <div className="w-full p-4 rounded-[var(--radius-glass-md)] bg-white/5 border border-white/10">
            <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mb-1">Firmante</p>
            <p className="text-base font-semibold text-[var(--off-white)] font-['DM_Sans']">
              {view.signer.name}
            </p>
            <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
              CC: {view.signer.identification_number}
            </p>
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            className="w-full min-h-[60px] text-lg"
            onClick={() => {
              if (!view.identity_verified) {
                setStep('identity')
              } else {
                setStep('reading')
              }
            }}
          >
            Comenzar
            <ChevronRight className="w-6 h-6" />
          </Button>

          <p className="text-xs text-[var(--muted)] font-['DM_Sans'] text-center">
            Firma válida bajo la Ley 527 de 1999 (Colombia)
          </p>
        </div>
      </div>
    )
  }

  // ── Pasos del flujo ────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0C1624 0%, #111E30 100%)' }}
    >
      {/* Header mínimo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-sm font-bold font-['Syne']" style={{ color: '#00D4FF' }}>
          SEÑAL
        </span>
        <span className="text-xs text-[var(--muted)] font-['DM_Sans'] truncate max-w-[60%] text-right">
          {view.document_name}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 'identity' && (
            <motion.div key="identity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <IdentityStep
                token={token!}
                onComplete={() => setStep('reading')}
              />
            </motion.div>
          )}

          {step === 'reading' && (
            <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReadingStep
                view={view}
                onComplete={() => setStep('signing')}
              />
            </motion.div>
          )}

          {step === 'signing' && (
            <motion.div key="signing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SigningStep
                token={token!}
                view={view}
                onComplete={(at) => {
                  setSignedAt(at)
                  setStep('success')
                }}
              />
            </motion.div>
          )}

          {step === 'success' && signedAt && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SuccessScreen signedAt={signedAt} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
