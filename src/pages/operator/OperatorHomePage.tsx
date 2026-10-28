import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, ChevronRight, LogIn, LogOut, CheckCircle2 } from 'lucide-react'
import api, { statusApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { FormTemplate, AttendanceRecord, UserContext } from '@/types'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'
import { TemplateIcon } from '@/components/ui/TemplateIcon'
import { SOSButton } from '@/components/ui/SOSButton'
import StoryIntro from '@/components/game/StoryIntro'
import { frequencyLabel } from '@/pages/operator/PermisosPage'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Constantes ────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function introShownKey() {
  return `intro_shown_${todayKey()}`
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Cartel de la jornada: el estado de asistencia es lo primero que el obrero
 * necesita resolver, así que ocupa el panel más grande y más contrastado.
 */
function AttendanceCard({ record }: { record: AttendanceRecord | null }) {
  const navigate = useNavigate()

  if (!record) {
    return (
      <button
        type="button"
        onClick={() => navigate('/asistencia')}
        className="w-full min-h-[96px] flex items-center gap-4 p-4 rounded-[24px] bg-[var(--brand)] text-[var(--on-brand)] text-left shadow-[inset_0_1.5px_0_rgba(255,255,255,0.55),0_2px_4px_rgba(23,22,15,0.25),0_16px_30px_-14px_rgba(168,127,0,0.8)] active:scale-[0.98] transition-transform duration-150"
      >
        <span className="w-14 h-14 rounded-[16px] bg-[var(--on-brand)] text-[var(--brand)] grid place-items-center shrink-0">
          <LogIn className="w-7 h-7" aria-hidden="true" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display font-extrabold text-[28px] leading-none">Marca tu entrada</span>
          <span className="block text-base font-medium mt-1 opacity-85">Aún no has registrado tu llegada</span>
        </span>
        <ChevronRight className="w-7 h-7 shrink-0" aria-hidden="true" />
      </button>
    )
  }

  if (record.exit_time) {
    const worked = record.total_minutes
      ? `${Math.floor(record.total_minutes / 60)} h ${record.total_minutes % 60} min`
      : null
    return (
      <div className="flex items-center gap-4 p-4 min-h-[96px] rounded-[24px] glass">
        <span className="w-14 h-14 rounded-[16px] bg-[var(--ok)] text-[var(--on-ok)] grid place-items-center shrink-0">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-extrabold text-[28px] leading-none text-[var(--fg)]">Jornada completada</p>
          <p className="text-base text-[var(--fg-muted)] mt-1">
            {formatTime(record.entry_time)} a {formatTime(record.exit_time)}
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
      className="w-full min-h-[104px] flex items-center gap-4 p-4 rounded-[24px] bg-[var(--brand)] text-[var(--on-brand)] text-left shadow-[inset_0_1.5px_0_rgba(255,255,255,0.55),0_2px_4px_rgba(23,22,15,0.25),0_16px_30px_-14px_rgba(168,127,0,0.8)] active:scale-[0.98] transition-transform duration-150"
    >
      <span className="relative w-14 h-14 rounded-[16px] bg-[var(--ok)] text-[var(--on-ok)] grid place-items-center shrink-0 border-[3px] border-[var(--fg)]">
        <Clock className="w-7 h-7" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--ok)] ring-[3px] ring-[var(--surface)] animate-pulse-dot" aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-display font-extrabold text-[28px] leading-none">En jornada</span>
        <span className="block text-base font-medium mt-1 opacity-85">Entraste a las {formatTime(record.entry_time)}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 min-h-[56px] px-4 rounded-[14px] bg-[var(--on-brand)] text-[var(--brand)] font-display font-extrabold text-2xl shrink-0">
        <LogOut className="w-5 h-5" aria-hidden="true" />
        Salida
      </span>
    </button>
  )
}

function TemplateCard({ template }: { template: FormTemplate }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/form/${template.id}`)}
      className="w-full min-h-[84px] flex items-center gap-4 p-3.5 pr-4 glass rounded-[20px] text-left active:scale-[0.98] active:bg-[var(--wash)] transition-[transform,background-color] duration-150"
    >
      <span className="w-14 h-14 rounded-[16px] bg-[var(--brand)] text-[var(--on-brand)] grid place-items-center shrink-0" aria-hidden="true"><TemplateIcon icon={template.icon} className="w-8 h-8" /></span>
      <span className="flex-1 min-w-0">
        <span className="block font-display font-bold text-[22px] leading-tight text-[var(--fg)] line-clamp-2">
          {template.name}
        </span>
        {template.description && (
          <span className="block text-base text-[var(--fg-muted)] line-clamp-1">{template.description}</span>
        )}
        <span className="inline-block mt-1 text-[13px] font-bold px-2 py-0.5 rounded-[6px] bg-[var(--wash-strong)] text-[var(--fg)]">
          {frequencyLabel(template.data_frequency)}
        </span>
      </span>
      <ChevronRight className="w-6 h-6 text-[var(--fg-muted)] shrink-0" aria-hidden="true" />
    </button>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function OperatorHomePage() {
  usePageTitle('Inicio')

  const { user } = useAuthStore()
  const navigate = useNavigate()

  const isLiteMode = sessionStorage.getItem('lite_mode') === 'true'
  const introAlreadyShown = !!localStorage.getItem(introShownKey())

  // Todos los hooks antes de cualquier return condicional (reglas de hooks)
  const [showIntro, setShowIntro] = useState(!isLiteMode && !introAlreadyShown)

  const { data: ctx } = useQuery({
    queryKey: QK.userContext(),
    queryFn: () => statusApi.getUserContext().then((r) => r.data as UserContext),
    staleTime: 60_000,
  })
  const firstName = (ctx?.name ?? localStorage.getItem('nombre_trabajador') ?? 'compañero').split(' ')[0]

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
        obraName={ctx?.work_location_name ?? 'la obra'}
        onComplete={handleIntroComplete}
      />
    )
  }

  // Modo lite: renderizar dashboard normal

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-x-hidden bg-[var(--bg)]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-5 pt-16 pb-5">
        <p className="text-base font-semibold text-[var(--fg-muted)]">{today.charAt(0).toUpperCase() + today.slice(1)}</p>
        <h1 className="font-display font-extrabold text-[44px] leading-[0.95] text-[var(--fg)] mt-1">
          Hola, {firstName}
        </h1>
        {(user?.jobTitle || ctx?.work_location_name) && (
          <p className="text-lg text-[var(--fg-muted)] mt-2">
            {[user?.jobTitle, ctx?.work_location_name].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 px-5">
        <section aria-label="Estado de asistencia">
          {loadingAttendance ? (
            <div className="h-24 rounded-[24px] bg-[var(--wash)] animate-pulse" />
          ) : (
            <AttendanceCard record={attendance ?? null} />
          )}
        </section>

        <section aria-label="Formularios disponibles">
          <h2 className="font-display font-bold text-[28px] leading-none text-[var(--fg)] mb-3">
            Mis formularios
          </h2>

          {loadingTemplates && <LoadingSpinner size="sm" label="Cargando formularios..." />}

          {!loadingTemplates && templatesError && (
            <ErrorMessage message="No se pudieron cargar los formularios." />
          )}

          {!loadingTemplates && !templatesError && templates.length === 0 && (
            <div className="glass p-8 rounded-[20px] text-center">
              <p className="text-[var(--fg-muted)] text-lg">
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
