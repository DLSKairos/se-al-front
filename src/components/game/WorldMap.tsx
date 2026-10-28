/**
 * WorldMap — Ruta de la jornada
 *
 * Cada formulario es una estación sobre un camino de obra. La forma de la
 * estación dice su estado, como un cartel ISO 7010:
 *   cuadrado verde  = inspección terminada (condición segura)
 *   círculo amarillo = la siguiente a hacer
 *   círculo claro    = pendiente
 * El camino solo gira a 90° y 45°, como un diagrama de rutas.
 * Los templates se cargan dinámicamente desde GET /form-templates.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, X, Route as RouteIcon, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import {
  getCompletedWorlds,
  computeWorldStatus,
  markWorldComplete,
} from '@/db/gameProgress'
import { TemplateIcon } from '@/components/ui/TemplateIcon'
import { SOSButton } from '@/components/ui/SOSButton'
import CircleTransition from './CircleTransition'
import { FormTemplate } from '@/types/index'

// ─── Geometría de la ruta ─────────────────────────────────────────────────────

const W = 360            // ancho lógico
const ROW = 200          // alto entre estaciones
const PAD_TOP = 70
const PAD_BOTTOM = 90
const X_LEFT = 100
const X_RIGHT = 260
const STATION = 80       // diámetro lógico de una estación

function stationX(i: number) {
  return i % 2 === 0 ? X_LEFT : X_RIGHT
}
function stationY(i: number) {
  return PAD_TOP + i * ROW
}

/** Tramo entre dos estaciones: baja, gira a 45°, y vuelve a bajar. */
function segmentPath(i: number) {
  const x1 = stationX(i), y1 = stationY(i)
  const x2 = stationX(i + 1), y2 = stationY(i + 1)
  const dx = Math.abs(x2 - x1)
  const lead = (ROW - dx) / 2
  return `M ${x1} ${y1} V ${y1 + lead} L ${x2} ${y1 + lead + dx} V ${y2}`
}

// ─── Componente principal ─────────────────────────────────────────────────────

type StationDatum = {
  template: FormTemplate
  index: number
  status: 'complete' | 'current' | 'locked'
  isCompleted: boolean
  isNext: boolean
}

export default function WorldMap() {
  const navigate = useNavigate()
  const { user, workLocationId } = useAuthStore()

  const cedula = user?.sub ?? 'anon'
  const obraId = workLocationId ?? '0'

  const { data: templates = [], isLoading } = useQuery({
    queryKey: QK.templates.active(),
    queryFn: () =>
      api.get<FormTemplate[]>('/form-templates').then((r) => r.data),
  })

  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [covering, setCovering] = useState(false)
  const [destination, setDestination] = useState<string | null>(null)

  useEffect(() => {
    setCompletedIds(getCompletedWorlds(cedula, obraId))
  }, [cedula, obraId])

  // Detectar si el usuario volvió de un nivel (game_mode en localStorage)
  useEffect(() => {
    const worldId = localStorage.getItem('game_mode')
    if (worldId) {
      localStorage.removeItem('game_mode')
      markWorldComplete(cedula, obraId, worldId)
      setCompletedIds(getCompletedWorlds(cedula, obraId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cerrar la hoja con Escape
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const navigateTo = (path: string) => {
    setDestination(path)
    setCovering(true)
  }

  const handleCoverDone = () => {
    if (destination) navigate(destination)
  }

  const completedCount = completedIds.length
  const total = templates.length
  const firstPendingIdx = templates.findIndex((t) => !completedIds.includes(t.id))

  const stations: StationDatum[] = templates.map((template, index) => ({
    template,
    index,
    status: computeWorldStatus(template.id, cedula, obraId),
    isCompleted: completedIds.includes(template.id),
    isNext: index === firstPendingIdx,
  }))

  const selectedData = stations.find((p) => p.template.id === selected) ?? null
  const userName = localStorage.getItem('nombre_trabajador') || 'Compañero'
  const allDone = total > 0 && completedCount >= total

  return (
    <div className="route-bg min-h-full pb-32" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto max-w-md px-5 pt-16">
        <header className="mb-2">
          <h1 className="font-display font-extrabold text-[44px] leading-[0.95] text-[var(--fg)]">
            Ruta de la jornada
          </h1>
          <p className="mt-2 text-lg text-[var(--fg-muted)]">{userName}</p>

          <div className="liquid mt-4 rounded-[20px] p-4">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="font-display font-bold text-2xl text-[var(--fg)]">
                {allDone ? '¡Ruta completa!' : `${completedCount} de ${total} inspecciones`}
              </span>
              <span className="font-display font-bold text-2xl text-[var(--fg)]">
                {total > 0 ? Math.round((completedCount / total) * 100) : 0}%
              </span>
            </div>
            <div
              className="h-3.5 rounded-full bg-[var(--wash-strong)] overflow-hidden"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemax={total}
              aria-label="Progreso del día"
            >
              <div
                className="hazard h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out)]"
                style={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </header>

        {isLoading ? (
          <LoadingState />
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          <RouteMap stations={stations} selected={selected} onSelect={setSelected} />
        )}
      </div>

      {selectedData && (
        <StationSheet
          data={selectedData}
          onClose={() => setSelected(null)}
          onNavigate={(path) => {
            setSelected(null)
            navigateTo(path)
          }}
        />
      )}

      <SOSButton />

      {covering && <CircleTransition direction="out" onDone={handleCoverDone} />}
    </div>
  )
}

// ─── Mapa de la ruta ──────────────────────────────────────────────────────────

function RouteMap({
  stations,
  selected,
  onSelect,
}: {
  stations: StationDatum[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const H = PAD_TOP + (stations.length - 1) * ROW + PAD_BOTTOM

  return (
    <div className="relative mx-auto mt-4 w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        {stations.slice(0, -1).map((s, i) => {
          const next = stations[i + 1]
          const done = s.isCompleted && next.isCompleted
          const active = s.isCompleted && !next.isCompleted || s.isNext
          const d = segmentPath(i)
          return (
            <g key={s.template.id} strokeLinejoin="round" strokeLinecap="butt" fill="none">
              <path d={d} strokeWidth={22} stroke={done ? 'var(--ok)' : active ? 'var(--fg)' : 'var(--surface-3)'} />
              <path
                d={d}
                strokeWidth={3}
                stroke={done ? 'rgba(255,255,255,0.85)' : active ? 'var(--brand)' : 'var(--line-strong)'}
                strokeDasharray="14 14"
                className={active && !done ? 'route-flow' : undefined}
              />
            </g>
          )
        })}
        {/* Meta */}
        <g transform={`translate(${stationX(stations.length - 1)} ${stationY(stations.length - 1) + 150})`}>
          <rect x={-30} y={-15} width={60} height={30} rx={4} fill="var(--fg)" />
          <text x={0} y={7} textAnchor="middle" fontFamily="Barlow Condensed" fontWeight={800} fontSize={20} fill="var(--bg)" letterSpacing={2}>
            META
          </text>
        </g>
      </svg>

      {stations.map((s) => (
        <StationButton
          key={s.template.id}
          data={s}
          H={H}
          isSelected={selected === s.template.id}
          onSelect={() => onSelect(s.template.id)}
        />
      ))}
    </div>
  )
}

// ─── Estación ─────────────────────────────────────────────────────────────────

function StationButton({
  data,
  H,
  isSelected,
  onSelect,
}: {
  data: StationDatum
  H: number
  isSelected: boolean
  onSelect: () => void
}) {
  const { template, index, isCompleted, isNext } = data
  const x = stationX(index)
  const y = stationY(index)
  const left = x < W / 2

  // Forma = estado
  const shape = isCompleted
    ? 'rounded-[22%] bg-[var(--ok)] text-[var(--on-ok)] border-[3px] border-[var(--fg)]'
    : isNext
    ? 'rounded-full bg-[var(--brand)] text-[var(--on-brand)] border-[4px] border-[var(--fg)]'
    : 'rounded-[34%] bg-[var(--surface)] text-[var(--fg)] border-[3px] border-[var(--fg)]'

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group absolute focus-visible:outline-offset-4"
      style={{
        left: `${(x / W) * 100}%`,
        top: `${(y / H) * 100}%`,
        width: `${(STATION / W) * 100}%`,
        aspectRatio: '1 / 1',
        transform: 'translate(-50%, -50%)',
      }}
      aria-label={`${template.name}${isCompleted ? ', completada' : isNext ? ', siguiente' : ', pendiente'}`}
      aria-pressed={isSelected}
    >
      <StationInner
        shape={shape}
        icon={template.icon}
        isCompleted={isCompleted}
        isNext={isNext}
        isSelected={isSelected}
        index={index}
        name={template.name}
        left={left}
      />
    </button>
  )
}

function StationInner({
  shape,
  icon,
  isCompleted,
  isNext,
  isSelected,
  index,
  name,
  left,
}: {
  shape: string
  icon?: string | null
  isCompleted: boolean
  isNext: boolean
  isSelected: boolean
  index: number
  name: string
  left: boolean
}) {
  return (
    <span
      className="relative block w-full h-full"
      style={{ animation: `game-pop 0.5s var(--ease-out) ${index * 90}ms both` }}
    >
      {isNext && (
        <span className="absolute inset-0 rounded-full border-[3px] border-[var(--brand)] pointer-events-none" style={{ animation: 'game-pulse-ring 2.2s ease-out infinite' }} aria-hidden="true" />
      )}
      <span
        className={`relative grid place-items-center w-full h-full transition-transform duration-200 ease-[var(--ease-out)] shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_10px_20px_-8px_rgba(23,22,15,0.55)] group-active:scale-95 ${shape} ${isSelected ? 'scale-110' : ''}`}
      >
        {isCompleted ? (
          <Check className="w-1/2 h-1/2" strokeWidth={3.5} aria-hidden="true" />
        ) : (
          <TemplateIcon icon={icon} className="w-1/2 h-1/2" />
        )}
      </span>
      <span
        className={`absolute top-1/2 -translate-y-1/2 w-[9.5rem] font-display font-bold text-[20px] leading-[1.05] text-[var(--fg)] ${
          left ? 'left-[calc(100%+0.75rem)] text-left' : 'right-[calc(100%+0.75rem)] text-right'
        }`}
      >
        <span className="line-clamp-3">{name}</span>
        {isNext && (
          <span className="mt-1 inline-block rounded-[6px] bg-[var(--fg)] text-[var(--bg)] px-2 py-0.5 text-[13px] font-body font-bold ">
            SIGUIENTE
          </span>
        )}
      </span>
    </span>
  )
}

// ─── Hoja de la estación seleccionada (vidrio líquido) ───────────────────────

function StationSheet({
  data,
  onClose,
  onNavigate,
}: {
  data: StationDatum
  onClose: () => void
  onNavigate: (path: string) => void
}) {
  const { template, isCompleted, status } = data
  const fieldsCount = template.fields?.length ?? 0
  const label = status === 'complete' ? 'Completada' : 'Iniciar inspección'

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar detalle"
        className="fixed inset-0 z-40 bg-[rgba(23,22,15,0.45)] animate-[fadeIn_0.2s_ease]"
      />

      <div
        key={template.id}
        role="dialog"
        aria-label={template.name}
        className="liquid fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-[28px] p-6 animate-game-slide-up"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-11 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-11 h-11 grid place-items-center rounded-full text-[var(--fg-muted)] hover:bg-[var(--wash)] hover:text-[var(--fg)] transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-start gap-4 pr-10">
          <span
            className={`shrink-0 w-16 h-16 grid place-items-center text-[34px] border-[3px] border-[var(--fg)] ${
              isCompleted ? 'rounded-[22%] bg-[var(--ok)] text-[var(--on-ok)]' : 'rounded-full bg-[var(--brand)]'
            }`}
            aria-hidden="true"
          >
            {isCompleted ? <Check className="w-9 h-9" strokeWidth={3.5} /> : <TemplateIcon icon={template.icon} className="w-9 h-9" />}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-extrabold text-[30px] leading-[1] text-[var(--fg)]">
              {template.name}
            </h2>
            {template.description && (
              <p className="mt-1.5 text-lg leading-snug text-[var(--fg-muted)]">{template.description}</p>
            )}
          </div>
        </div>

        <p className="mt-4 text-base font-semibold text-[var(--fg-muted)]">
          {fieldsCount > 0 ? `${fieldsCount} ${fieldsCount === 1 ? 'pregunta' : 'preguntas'}` : 'Registro rápido'}
        </p>

        {status === 'complete' ? (
          <div className="mt-4 flex items-center justify-center gap-2 min-h-[60px] rounded-[16px] bg-[var(--ok)] text-[var(--on-ok)] font-display font-bold text-2xl">
            <Check className="w-7 h-7" strokeWidth={3.5} aria-hidden="true" />
            {label}
          </div>
        ) : (
          <button
            type="button"
            className="btn-3d mt-4 w-full"
            onClick={() => onNavigate(`/game/level/${template.id}`)}
          >
            {label}
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  )
}

// ─── Estados auxiliares ───────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="mt-10 flex flex-col gap-10" aria-live="polite" aria-label="Cargando la ruta">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`flex items-center gap-4 ${i % 2 ? 'flex-row-reverse' : ''}`}>
          <div className="w-20 h-20 rounded-full bg-[var(--wash-strong)] animate-pulse" />
          <div className="h-6 w-36 rounded-md bg-[var(--wash-strong)] animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 text-center px-4">
      <span className="w-20 h-20 rounded-[22px] bg-[var(--brand)] text-[var(--on-brand)] grid place-items-center">
        <RouteIcon className="w-10 h-10" aria-hidden="true" />
      </span>
      <p className="font-display font-extrabold text-3xl text-[var(--fg)] leading-tight">
        No hay inspecciones hoy
      </p>
      <p className="text-lg text-[var(--fg-muted)]">
        Cuando tu administrador active formularios para tu obra, aparecerán aquí como estaciones de la ruta.
      </p>
    </div>
  )
}
