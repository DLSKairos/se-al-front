/**
 * LevelWrapper — Orquestador del flujo de un nivel/formulario gamificado.
 *
 * Carga el contexto del formulario desde la API y navega pregunta por pregunta.
 * Campos GEOLOCATION → captura GPS al inicio, no como pregunta visible.
 * Campos SIGNATURE → paso especial al final (no implementado como pregunta inline).
 * Al completar → POST /form-submissions → markWorldComplete → navega al mapa.
 */
import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, X, TriangleAlert, ClipboardX } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { fieldTypeToQuestion } from '@/lib/fieldToQuestion'
import { markWorldComplete } from '@/db/gameProgress'
import CircleTransition from './CircleTransition'
import MicroCelebration from './questions/MicroCelebration'
import YesNoQuestion from './questions/YesNoQuestion'
import MultiSelectQuestion from './questions/MultiSelectQuestion'
import TextInputQuestion from './questions/TextInputQuestion'
import TypewriterQuestion from './questions/TypewriterQuestion'
import { FormField, FormContext } from '@/types'
import { SignatureField } from '@/components/forms/fields/SignatureField'

// ─── Pantallas simples ────────────────────────────────────────────────────────
function Screen({ children }: { children: React.ReactNode }) {
  return <div className="route-bg min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center">{children}</div>
}

function LoadingScreen({ label }: { label?: string }) {
  return (
    <Screen>
      <div className="w-12 h-12 rounded-full border-4 border-[var(--line)] border-t-[var(--brand)] animate-spin" />
      {label && <p className="text-lg text-[var(--fg-muted)]">{label}</p>}
    </Screen>
  )
}

function MessageScreen({ icon, title, text, action, onAction }: { icon: React.ReactNode; title: string; text?: string; action: string; onAction: () => void }) {
  return (
    <Screen>
      <span className="w-20 h-20 rounded-[22px] bg-[var(--brand)] text-[var(--on-brand)] grid place-items-center">{icon}</span>
      <h2 className="font-display font-extrabold text-4xl leading-none text-[var(--fg)]">{title}</h2>
      {text && <p className="text-lg text-[var(--fg-muted)] max-w-xs">{text}</p>}
      <button className="btn-3d w-full max-w-xs" onClick={onAction}>{action}</button>
    </Screen>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LevelWrapper() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate       = useNavigate()
  const { user, workLocationId } = useAuthStore()

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [answers,           setAnswers]           = useState<Record<string, unknown>>({})
  const [geoLocation,       setGeoLocation]       = useState<{ lat: number; lng: number } | null>(null)
  const [showCelebration,   setShowCelebration]   = useState(false)
  const [submitting,        setSubmitting]        = useState(false)
  const [submitError,       setSubmitError]       = useState<string | null>(null)
  const [missionDone,       setMissionDone]       = useState(false)
  const [revealing,         setRevealing]         = useState(true)
  const [typingDone,        setTypingDone]        = useState(false)
  const [showSignatureStep, setShowSignatureStep] = useState(false)
  const [signatureAnswers,  setSignatureAnswers]  = useState<Record<string, string>>({})

  const { data: context, isLoading, error } = useQuery({
    queryKey: QK.templates.context(templateId!),
    queryFn:  () =>
      api
        .get<FormContext>(`/form-submissions/context/${templateId}`)
        .then((r) => r.data),
    enabled: !!templateId,
  })

  // Capturar GPS automáticamente si hay campos GEOLOCATION
  useEffect(() => {
    const hasGeo = context?.template.fields.some((f) => f.type === 'GEOLOCATION')
    if (!hasGeo) return

    navigator.geolocation?.getCurrentPosition(
      (pos) => setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // GPS no disponible — continuar igual
    )
  }, [context])

  // Resetear typewriter al cambiar de pregunta
  useEffect(() => { setTypingDone(false) }, [currentFieldIndex])

  // Campos visibles (excluir GEOLOCATION y SIGNATURE del flujo de preguntas)
  const visibleFields = useMemo(
    () =>
      context?.template.fields
        .filter((f) => f.type !== 'GEOLOCATION' && f.type !== 'SIGNATURE')
        .sort((a, b) => a.order - b.order) ?? [],
    [context],
  )

  const signatureFields = useMemo(
    () =>
      context?.template.fields
        .filter((f) => f.type === 'SIGNATURE')
        .sort((a, b) => a.order - b.order) ?? [],
    [context],
  )

  const currentField = visibleFields[currentFieldIndex]
  const isLastField  = currentFieldIndex === visibleFields.length - 1
  const progressPct  = visibleFields.length > 0
    ? (currentFieldIndex / visibleFields.length) * 100
    : 0

  const handleAnswer = async (fieldKey: string, value: unknown) => {
    const newAnswers = { ...answers, [fieldKey]: value }
    setAnswers(newAnswers)
    setShowCelebration(true)

    await new Promise<void>((r) => setTimeout(r, 650))
    setShowCelebration(false)

    if (isLastField) {
      if (signatureFields.length > 0) {
        setShowSignatureStep(true)
      } else {
        await handleSubmit(newAnswers)
      }
    } else {
      setCurrentFieldIndex((i) => i + 1)
    }
  }

  const handleSubmit = async (finalAnswers: Record<string, unknown>, sigs: Record<string, string> = {}) => {
    if (!templateId || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const submissionRes = await api.post<{ id: string }>('/form-submissions', {
        template_id:      templateId,
        work_location_id: workLocationId ?? null,
        data:             { ...finalAnswers, ...sigs },
        ...(geoLocation
          ? { geo_lat: geoLocation.lat, geo_lng: geoLocation.lng }
          : {}),
      })

      const submissionId = submissionRes.data.id

      for (const sigField of signatureFields) {
        const dataURL = sigs[sigField.key]
        if (!dataURL) continue
        await api.post(`/form-submissions/${submissionId}/signatures`, {
          signer_name:   sigField.label,
          signer_role:   sigField.label,
          signature_url: dataURL,
        })
      }

      if (user) {
        markWorldComplete(user.sub, workLocationId ?? '0', templateId)
      }

      setMissionDone(true)
      setTimeout(() => navigate('/game/world-map', { replace: true }), 3200)
    } catch (err) {
      const errAny = err as { response?: { data?: { detalle?: string; error?: string } } }
      const detalle = errAny?.response?.data?.detalle ?? errAny?.response?.data?.error ?? null
      setSubmitError(
        detalle
          ? `Error del servidor: ${detalle}`
          : 'No se pudo guardar. Revisa tu conexión e intenta de nuevo.',
      )
      setSubmitting(false)
    }
  }

  const handleExit = () => {
    localStorage.removeItem('game_mode')
    navigate('/game/world-map', { replace: true })
  }

  // ─── Estados de carga / error ───────────────────────────────────────────────
  if (isLoading) return <LoadingScreen label="Cargando formulario..." />
  if (error || !context) {
    return <MessageScreen icon={<TriangleAlert className="w-10 h-10" />} title="No se pudo cargar" text="Revisa tu conexión e inténtalo de nuevo." action="Volver a la ruta" onAction={handleExit} />
  }

  if (context.is_readonly) {
    return <MessageScreen icon={<Check className="w-11 h-11" strokeWidth={3.5} />} title="Ya la completaste" text={context.template.name} action="Volver a la ruta" onAction={handleExit} />
  }

  // Plantilla sin preguntas para el juego: antes dejaba la pantalla en blanco
  if (visibleFields.length === 0 && signatureFields.length === 0) {
    return <MessageScreen icon={<ClipboardX className="w-10 h-10" />} title="Sin preguntas" text="Este formulario no tiene preguntas para el modo juego. Ábrelo en el formulario completo." action="Abrir formulario" onAction={() => navigate(`/form/${templateId}`)} />
  }

  const questionType = currentField ? fieldTypeToQuestion(currentField.type) : null

  return (
    <div className="fixed inset-0 route-bg flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Barra superior: salir + progreso por pregunta */}
      <header className="liquid shrink-0 mx-3 mt-3 rounded-[24px] p-2 pr-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleExit}
          className="w-12 h-12 shrink-0 grid place-items-center rounded-full text-[var(--fg)] hover:bg-[var(--wash)] active:scale-95 transition"
          aria-label="Salir de la inspección"
        >
          <X className="w-7 h-7" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-xl leading-none text-[var(--fg)] truncate">{context.template.name}</p>
          <div className="flex gap-1 mt-2" role="progressbar" aria-valuenow={currentFieldIndex} aria-valuemax={visibleFields.length} aria-label="Progreso">
            {visibleFields.map((f, i) => (
              <span
                key={f.id}
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i < currentFieldIndex ? 'bg-[var(--ok)]' : i === currentFieldIndex ? 'bg-[var(--brand)] shadow-[0_0_0_1.5px_var(--fg)]' : 'bg-[var(--line-strong)]'}`}
              />
            ))}
          </div>
        </div>
        <span className="font-display font-bold text-xl text-[var(--fg-muted)] tabular-nums shrink-0">
          {Math.min(currentFieldIndex + 1, visibleFields.length)}/{visibleFields.length}
        </span>
      </header>

      <div className="flex-1 px-5 pt-6 overflow-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] mx-auto w-full max-w-md flex flex-col">
        {showCelebration && <MicroCelebration show type="positive" />}

        {submitting && !missionDone && (
          <div className="flex flex-col items-center gap-4 h-full justify-center" aria-live="polite">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--line)] border-t-[var(--brand)] animate-spin" />
            <p className="text-xl font-semibold text-[var(--fg)]">Guardando…</p>
          </div>
        )}

        {submitError && !submitting && (
          <div className="flex flex-col items-center gap-4 text-center h-full justify-center" role="alert">
            <span className="w-16 h-16 rounded-[18px] bg-[var(--warn)] text-[var(--on-warn)] grid place-items-center"><TriangleAlert className="w-9 h-9" /></span>
            <p className="text-lg font-semibold text-[var(--danger-ink)]">{submitError}</p>
            <button className="btn-3d w-full" onClick={() => handleSubmit(answers, signatureAnswers)}>Reintentar</button>
          </div>
        )}

        {showSignatureStep && !submitting && !missionDone && !submitError && (
          <div className="flex flex-col gap-6">
            <h2 className="font-display font-extrabold text-[38px] leading-none text-[var(--fg)]">Falta tu firma</h2>
            {signatureFields.map((sigField) => (
              <div key={sigField.id} className="flex flex-col gap-2">
                <p className="text-lg font-semibold text-[var(--fg)]">{sigField.label}</p>
                <SignatureField
                  field={sigField}
                  value={signatureAnswers[sigField.key] ?? ''}
                  onChange={(dataURL) => setSignatureAnswers((prev) => ({ ...prev, [sigField.key]: dataURL }))}
                />
              </div>
            ))}
            <button className="btn-3d w-full" onClick={() => handleSubmit(answers, signatureAnswers)}>Confirmar y guardar</button>
          </div>
        )}

        {!showSignatureStep && !showCelebration && !submitting && !missionDone && !submitError && currentField && questionType && (
          <>
            {currentField.help_text && (
              <p className="text-lg font-semibold text-[var(--fg-muted)] mb-2">{currentField.label}</p>
            )}
            <TypewriterQuestion
              text={currentField.help_text ?? currentField.label}
              onDone={() => setTypingDone(true)}
            />
            <div className="flex-1 min-h-8" />

            {questionType === 'yesno' && (
              <YesNoQuestion
                key={currentFieldIndex}
                typingDone={typingDone}
                onAnswer={(v) => handleAnswer(currentField.key, v ? 'true' : 'false')}
              />
            )}

            {questionType === 'multiselect' && currentField.options && (
              <MultiSelectQuestion
                key={currentFieldIndex}
                options={currentField.options}
                multiple={currentField.type === 'MULTISELECT'}
                typingDone={typingDone}
                onAnswer={(v) => handleAnswer(currentField.key, v)}
              />
            )}

            {(questionType === 'text' || questionType === 'number' || questionType === 'date') && (
              <TextInputQuestion
                key={currentFieldIndex}
                type={questionType === 'number' ? 'number' : questionType === 'date' ? 'date' : 'text'}
                required={currentField.required}
                typingDone={typingDone}
                onAnswer={(v) => handleAnswer(currentField.key, v)}
              />
            )}

            {(questionType === 'file' || questionType === 'photo' || questionType === 'signature') && (
              <div className="flex flex-col gap-3">
                <p className="text-lg text-[var(--fg-muted)]">
                  Las fotos y archivos se adjuntan en el formulario completo.
                </p>
                <button className="btn-3d w-full" onClick={() => navigate(`/form/${templateId}`)}>
                  Abrir formulario completo
                </button>
                {!currentField.required && (
                  <button
                    className="min-h-[56px] rounded-[16px] border-[1.5px] border-[color:var(--line-strong)] bg-[var(--surface)] text-[var(--fg)] font-bold text-lg"
                    onClick={() => handleAnswer(currentField.key, null)}
                  >
                    Omitir esta pregunta
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {missionDone && (
        <div className="fixed inset-0 route-bg flex flex-col items-center justify-center px-8 z-50">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="absolute w-3 h-3 rounded-[3px]"
                style={{
                  left: `${8 + (i * 6.5) % 84}%`,
                  top: '-5%',
                  background: (['var(--brand)', 'var(--ok)', 'var(--fg)'] as const)[i % 3],
                  animation: `confetti-fall ${2 + (i % 4) * 0.5}s ease-in forwards ${(i % 5) * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span className="w-32 h-32 rounded-[26%] bg-[var(--ok)] text-[var(--on-ok)] border-[5px] border-[var(--fg)] grid place-items-center mb-6 relative z-10 game-fade-scale shadow-[inset_0_3px_0_rgba(255,255,255,0.4),0_24px_40px_-16px_rgba(0,135,60,0.8)]">
            <svg viewBox="0 0 24 24" className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" className="check-draw" />
            </svg>
          </span>
          <div className="text-center relative z-10 animate-fade-up">
            <h1 className="font-display font-extrabold text-[44px] leading-none text-[var(--fg)] mb-2">¡Inspección completa!</h1>
            <p className="text-lg text-[var(--fg-muted)]">{context.template.name}</p>
          </div>
          <button className="btn-3d mt-8 relative z-10 w-full max-w-xs" onClick={handleExit}>Volver a la ruta</button>
        </div>
      )}

      {revealing && <CircleTransition direction="in" onDone={() => setRevealing(false)} />}
    </div>
  )
}
