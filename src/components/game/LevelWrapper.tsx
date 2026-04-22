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
import { Check } from 'lucide-react'
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

// ─── Spinner & Error inline (evitar dependencia externa que no existe aún) ────
function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[var(--navy)] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[var(--signal)] border-t-transparent animate-spin" />
      {label && (
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">{label}</p>
      )}
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--navy)] flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="text-5xl">⚠️</div>
      <p className="text-[var(--off-white)] font-['DM_Sans']">{message}</p>
      <button
        onClick={() => navigate('/game/world-map')}
        className="text-[var(--signal)] hover:underline text-sm font-['DM_Sans']"
      >
        ← Volver al mapa
      </button>
    </div>
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

  const currentField = visibleFields[currentFieldIndex]
  const isLastField  = currentFieldIndex === visibleFields.length - 1
  const progressPct  = visibleFields.length > 0
    ? (currentFieldIndex / visibleFields.length) * 100
    : 0

  const handleAnswer = async (fieldKey: string, value: unknown) => {
    const newAnswers = { ...answers, [fieldKey]: value }
    setAnswers(newAnswers)
    setShowCelebration(true)

    await new Promise<void>((r) => setTimeout(r, 800))
    setShowCelebration(false)

    if (isLastField) {
      await handleSubmit(newAnswers)
    } else {
      setCurrentFieldIndex((i) => i + 1)
    }
  }

  const handleSubmit = async (finalAnswers: Record<string, unknown>) => {
    if (!templateId || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      await api.post('/form-submissions', {
        template_id:      templateId,
        work_location_id: workLocationId ?? null,
        values:           finalAnswers,
        ...(geoLocation
          ? { geo_lat: geoLocation.lat, geo_lng: geoLocation.lng }
          : {}),
      })

      if (user) {
        markWorldComplete(user.sub, workLocationId ?? '0', templateId)
      }

      setMissionDone(true)
      setTimeout(() => navigate('/game/world-map', { replace: true }), 1800)
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
  if (error || !context) return <ErrorScreen message="Error al cargar el formulario" />

  // ─── Formulario ya completado ───────────────────────────────────────────────
  if (context.is_readonly) {
    return (
      <div className="min-h-screen bg-[var(--navy)] flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.15)] border-2 border-green-500 grid place-items-center">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="font-display font-extrabold text-xl text-[var(--off-white)]">
          Ya completaste este formulario
        </h2>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          {context.template.name}
        </p>
        <button
          onClick={() => navigate('/game/world-map')}
          className="glass p-4 rounded-[14px] text-[var(--signal)] font-dm text-sm hover:text-[var(--off-white)] transition-colors"
        >
          ← Volver al mapa
        </button>
      </div>
    )
  }

  if (!currentField && !submitting && !missionDone && !submitError) return null

  const questionType = currentField ? fieldTypeToQuestion(currentField.type) : null

  return (
    <div
      className="fixed inset-0 bg-cosmos flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Barra de progreso */}
      <div className="h-1.5 shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(to right, var(--amber), var(--terracotta))',
          }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 shrink-0">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-sub text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--amber)' }}>
            MISIÓN
          </span>
          <span className="font-display font-extrabold text-lg truncate" style={{ color: 'var(--cream)' }}>
            {context.template.name}
          </span>
        </div>
        <button
          className="card-glass shrink-0 w-8 h-8 rounded-full grid place-items-center font-bold text-sm border-0 cursor-pointer transition-colors"
          style={{ color: 'rgba(250,244,232,0.7)' }}
          onClick={handleExit}
          aria-label="Salir de la misión"
        >
          ✕
        </button>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 px-5 overflow-auto pb-24">

        {/* Estado: celebración */}
        {showCelebration && (
          <MicroCelebration show type="positive" />
        )}

        {/* Estado: submitting */}
        {submitting && !missionDone && (
          <div className="flex flex-col items-center gap-4 h-full justify-center" aria-live="polite">
            <span className="text-5xl">⏳</span>
            <p className="text-base text-[var(--off-white)] font-['DM_Sans']">
              Guardando misión…
            </p>
          </div>
        )}

        {/* Estado: error de submit */}
        {submitError && !submitting && (
          <div className="flex flex-col items-center gap-4 max-w-sm text-center h-full justify-center mx-auto" role="alert">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm text-red-400 font-['DM_Sans']">{submitError}</p>
            <button
              className="btn-primary-gradient rounded-[14px] px-6 py-2.5 font-bold font-['Syne'] text-sm"
              onClick={() => handleSubmit(answers)}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Pregunta activa */}
        {!showCelebration && !submitting && !missionDone && !submitError && currentField && questionType && (
          <>
            {/* Etiqueta contextual: nombre de misión · pregunta N de M */}
            <div className="flex items-center gap-2 mb-4">
              <span className="font-sub text-[10px] uppercase tracking-widest text-[var(--amber)]">
                {context.template.name}
              </span>
              <span className="text-[rgba(255,255,255,0.2)] text-xs">·</span>
              <span className="font-sub text-[10px] uppercase tracking-widest text-[rgba(250,244,232,0.45)]">
                Pregunta {currentFieldIndex + 1} de {visibleFields.length}
              </span>
            </div>

            <TypewriterQuestion
              text={currentField.label}
              speed={35}
              onDone={() => setTypingDone(true)}
            />

            {/* Espaciado entre pregunta y opciones */}
            <div className="mb-8" />

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
                type={
                  questionType === 'number'
                    ? 'number'
                    : questionType === 'date'
                    ? 'date'
                    : 'text'
                }
                required={currentField.required}
                typingDone={typingDone}
                onAnswer={(v) => handleAnswer(currentField.key, v)}
              />
            )}

            {(questionType === 'file' || questionType === 'photo' || questionType === 'signature') && (
              <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
                  Captura no disponible en este dispositivo
                </p>
                <button
                  className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/20 text-[var(--off-white)] font-['Syne'] text-sm hover:bg-white/20 transition-colors"
                  onClick={() => handleAnswer(currentField.key, null)}
                >
                  Omitir →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Estado: misión completada — overlay sobre todo */}
      {missionDone && (
        <div className="fixed inset-0 bg-[var(--navy)] flex flex-col items-center justify-center px-8 z-50">
          {/* Radial burst */}
          <div
            className="absolute w-[300px] h-[300px] rounded-full animate-fade-up"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(34,197,94,0.08) 40%, transparent 70%)' }}
          />
          {/* Mini confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left:       `${10 + (i * 6.5) % 80}%`,
                  top:        '-5%',
                  background: (['var(--signal)', '#22c55e', 'var(--amber)'] as const)[i % 3],
                  animation:  `confetti-fall ${2 + (i % 4) * 0.5}s ease-in forwards ${(i % 5) * 0.1}s`,
                  opacity:    0.8,
                }}
              />
            ))}
          </div>
          {/* Checkmark */}
          <div
            className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.15)] border-2 border-green-500 grid place-items-center mb-6 relative z-10"
            style={{ boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}
          >
            <Check className="w-8 h-8 text-green-400" />
          </div>
          {/* Texto */}
          <div className="text-center relative z-10 animate-fade-up">
            <h1 className="font-display font-extrabold text-[28px] text-[var(--signal)] mb-2">
              ¡MISIÓN COMPLETADA!
            </h1>
            <p className="text-sm text-[var(--muted)] font-dm">{context?.template.name}</p>
          </div>
          {/* Badge del template */}
          <div className="glass p-4 mt-6 flex items-center gap-3 relative z-10" style={{ borderRadius: 16 }}>
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-display font-bold text-sm text-[var(--off-white)]">Permiso completado</div>
              <div className="text-xs text-[var(--muted)] font-dm">Volviendo al mapa...</div>
            </div>
          </div>
        </div>
      )}

      {/* CircleTransition de entrada */}
      {revealing && (
        <CircleTransition direction="in" onDone={() => setRevealing(false)} />
      )}
    </div>
  )
}
