import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Clock, ChevronRight, LogIn } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { FormTemplate, AttendanceRecord } from '@/types'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'
import { SOSButton } from '@/components/ui/SOSButton'
import StoryIntro from '@/components/game/StoryIntro'

// ── Constantes ────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function introShownKey() {
  return `intro_shown_${todayKey()}`
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function AttendanceCard({ record }: { record: AttendanceRecord | null }) {
  const navigate = useNavigate()

  if (!record) {
    return (
      <button
        type="button"
        onClick={() => navigate('/asistencia')}
        className="w-full flex items-center gap-4 p-5 glass rounded-[20px] border-l-2 border-l-[var(--amber)] hover:bg-[rgba(245,166,35,0.05)] transition-all text-left"
      >
        <div className="w-10 h-10 rounded-[12px] bg-[rgba(245,166,35,0.1)] flex items-center justify-center shrink-0 border border-[rgba(245,166,35,0.2)]">
          <LogIn className="w-5 h-5 text-amber-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--amber)] mb-0.5">
            Pendiente
          </p>
          <p className="text-sm font-display font-semibold text-[var(--off-white)]">Sin registro de entrada</p>
          <p className="text-xs text-[var(--muted)] font-dm mt-0.5">Toca para registrar tu llegada</p>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
      </button>
    )
  }

  const entryTime = new Date(record.entry_time).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (record.exit_time) {
    const exitTime = new Date(record.exit_time).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const worked = record.total_minutes
      ? `${Math.floor(record.total_minutes / 60)}h ${record.total_minutes % 60}m`
      : null

    return (
      <div className="flex items-center gap-4 p-5 glass rounded-[20px] border-l-2 border-l-emerald-500">
        <div className="w-10 h-10 rounded-[12px] bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <Clock className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-emerald-400 mb-0.5">
            Completada
          </p>
          <p className="text-sm font-display font-semibold text-[var(--off-white)]">Jornada completada</p>
          <p className="text-xs text-[var(--muted)] font-dm mt-0.5">
            {entryTime} — {exitTime}
            {worked ? ` · ${worked}` : ''}
          </p>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/asistencia')}
      className="w-full flex items-center gap-4 p-5 glass rounded-[20px] border-l-2 border-l-[var(--signal)] hover:bg-[rgba(0,212,255,0.04)] transition-all text-left"
    >
      <div className="w-10 h-10 rounded-[12px] bg-[var(--signal-dim)] flex items-center justify-center shrink-0 border border-[rgba(0,212,255,0.2)]">
        <Clock className="w-5 h-5 text-[var(--signal)]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-0.5">
          En jornada
        </p>
        <p className="text-sm font-display font-semibold text-[var(--off-white)]">Jornada activa</p>
        <p className="text-xs text-[var(--muted)] font-dm mt-0.5">Entrada: {entryTime} · Toca para registrar salida</p>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
    </button>
  )
}

interface TemplateCardProps {
  template: FormTemplate
}

function TemplateCard({ template }: TemplateCardProps) {
  const navigate = useNavigate()

  const icon = template.icon ?? '📋'

  const handleClick = () => {
    navigate(`/form/${template.id}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center gap-4 p-5 glass rounded-[20px] hover:border-[rgba(0,212,255,0.3)] transition-all text-left active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-[14px] bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-2xl shrink-0 border border-white/5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-[var(--off-white)] truncate mb-1">
          {template.name}
        </p>
        {template.description && (
          <p className="text-xs text-[var(--muted)] font-dm line-clamp-1 mb-1.5">
            {template.description}
          </p>
        )}
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-[rgba(0,212,255,0.1)] text-[var(--signal)] border border-[rgba(0,212,255,0.25)]">
          {template.data_frequency === 'DAILY'
            ? 'Diario'
            : template.data_frequency === 'WEEKLY'
            ? 'Semanal'
            : template.data_frequency === 'PER_EVENT'
            ? 'Por evento'
            : template.data_frequency === 'ONCE'
            ? 'Una vez'
            : 'Cuando aplique'}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
    </button>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function OperatorHomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const firstName = user?.jobTitle ?? 'Operario'

  const isLiteMode = sessionStorage.getItem('lite_mode') === 'true'
  const introAlreadyShown = !!localStorage.getItem(introShownKey())

  // Todos los hooks antes de cualquier return condicional (reglas de hooks)
  const [showIntro, setShowIntro] = useState(!isLiteMode && !introAlreadyShown)

  const {
    data: templates = [],
    isLoading: loadingTemplates,
    error: templatesError,
  } = useQuery({
    queryKey: QK.templates.active(),
    queryFn: () => api.get<FormTemplate[]>('/form-templates').then((r) => r.data),
  })

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: QK.attendance.today(),
    queryFn: () =>
      api
        .get<AttendanceRecord | null>('/attendance/today')
        .then((r) => r.data)
        .catch(() => null),
  })

  const handleIntroComplete = () => {
    localStorage.setItem(introShownKey(), '1')
    setShowIntro(false)
    const liteModeNow = sessionStorage.getItem('lite_mode') === 'true'
    if (!liteModeNow) navigate('/game/world-map', { replace: true })
  }

  // Game mode + intro ya vista hoy → redirect directo al WorldMap
  if (!isLiteMode && introAlreadyShown) {
    return <Navigate to="/game/world-map" replace />
  }

  // Game mode + primer acceso del día → mostrar intro
  if (showIntro) {
    return (
      <StoryIntro
        character="trabajador"
        obraName={user?.orgId ?? 'la obra'}
        onComplete={handleIntroComplete}
      />
    )
  }

  // Modo lite: renderizar dashboard normal

  // Calcular progreso de formularios (placeholder — no hay dato de completados por template)
  const totalCount = templates.length
  const completedCount = 0
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-x-hidden bg-(--navy) pb-24"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-1">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-display font-extrabold text-xl sm:text-2xl text-(--off-white) leading-tight wrap-break-word">
          Hola, <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="text-sm text-[var(--muted)] font-dm mt-1">
          Que tengas una jornada segura
        </p>
      </div>

      {/* Progress bar de formularios */}
      {!loadingTemplates && totalCount > 0 && (
        <div className="px-6 mb-6">
          <div className="flex justify-between text-[10px] text-[var(--muted)] mb-1.5 font-semibold tracking-[0.1em] uppercase">
            <span>{completedCount} de {totalCount} completados</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--signal)] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 px-6">
        {/* Asistencia */}
        <section aria-label="Estado de asistencia">
          {loadingAttendance ? (
            <div className="h-20 rounded-[20px] bg-white/5 animate-pulse" />
          ) : (
            <AttendanceCard record={attendance ?? null} />
          )}
        </section>

        {/* Formularios */}
        <section aria-label="Formularios disponibles">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-[var(--signal)]" aria-hidden="true" />
            <h2 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)]">
              Mis formularios
            </h2>
          </div>

          {loadingTemplates && <LoadingSpinner size="sm" label="Cargando formularios..." />}

          {!loadingTemplates && templatesError && (
            <ErrorMessage message="No se pudieron cargar los formularios." />
          )}

          {!loadingTemplates && !templatesError && templates.length === 0 && (
            <div className="glass p-8 rounded-[20px] text-center">
              <p className="text-[var(--muted)] text-sm font-dm">
                No tienes formularios asignados por el momento.
              </p>
            </div>
          )}

          {!loadingTemplates && !templatesError && templates.length > 0 && (
            <div className="flex flex-col gap-3">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </section>
      </div>

      <SOSButton />

    </div>
  )
}
