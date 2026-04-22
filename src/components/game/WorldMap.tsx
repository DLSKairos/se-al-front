/**
 * WorldMap — Universo Operativo
 * Diseño cósmico con planetas interactivos y constelaciones.
 * Los templates se cargan dinámicamente desde GET /form-templates.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import {
  getCompletedWorlds,
  computeWorldStatus,
  markWorldComplete,
} from '@/db/gameProgress'
import CircleTransition from './CircleTransition'
import { FormTemplate } from '@/types/index'

// ─── Datos de diseño ──────────────────────────────────────────────────────────

type PlanetPos = { x: number; y: number; size: number }

const BASE_POSITIONS: PlanetPos[] = [
  { x: 28, y: 22, size: 132 },
  { x: 72, y: 38, size: 108 },
  { x: 24, y: 62, size: 116 },
  { x: 70, y: 80, size: 124 },
  { x: 45, y: 48, size: 100 },
]

const HUES = [70, 280, 145, 45, 200, 320]

const SCATTERED_STARS = [
  { x: 50, y: 8,  r: 1,   o: 0.7 },
  { x: 88, y: 12, r: 1.2, o: 0.5 },
  { x: 8,  y: 38, r: 0.8, o: 0.6 },
  { x: 92, y: 55, r: 1,   o: 0.7 },
  { x: 48, y: 50, r: 0.9, o: 0.4 },
  { x: 12, y: 78, r: 1.1, o: 0.6 },
  { x: 50, y: 92, r: 1,   o: 0.5 },
  { x: 38, y: 30, r: 0.7, o: 0.4 },
  { x: 60, y: 68, r: 0.8, o: 0.5 },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function WorldMap() {
  const navigate = useNavigate()
  const { user, workLocationId } = useAuthStore()

  const cedula = user?.sub ?? 'anon'
  const obraId = workLocationId ?? '0'

  // Cargar todos los templates (no sólo activos) para el mapa
  const { data: templates = [], isLoading } = useQuery({
    queryKey: QK.templates.active(),
    queryFn: () =>
      api.get<FormTemplate[]>('/form-templates').then((r) => r.data),
  })

  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [covering, setCovering] = useState(false)
  const [destination, setDestination] = useState<string | null>(null)

  // Cargar progreso al montar
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

  const navigateTo = (path: string) => {
    setDestination(path)
    setCovering(true)
  }

  const handleCoverDone = () => {
    if (destination) navigate(destination)
  }

  const completedCount = completedIds.length
  const progressPct =
    templates.length > 0 ? (completedCount / templates.length) * 100 : 0

  const userName = localStorage.getItem('nombre_trabajador') || user?.sub || 'Operario'

  // Enriquecer templates con pos, hue, estado
  const planetsData = templates.map((template, index) => ({
    template,
    pos: BASE_POSITIONS[index % BASE_POSITIONS.length],
    hue: HUES[index % HUES.length],
    index,
    status: computeWorldStatus(template.id, cedula, obraId),
    isCompleted: completedIds.includes(template.id),
  }))

  const selectedData = planetsData.find((p) => p.template.id === selected) ?? null

  return (
    <div className="bg-cosmos relative min-h-full overflow-hidden pb-20" style={{ color: 'var(--cream)' }}>
      {/* Estrellas fugaces decorativas */}
      <div
        className="pointer-events-none absolute left-0 top-32 h-px w-24"
        style={{
          background: 'linear-gradient(to right, transparent, var(--cream), transparent)',
          animation: 'game-shooting-star 7s linear infinite',
        }}
      />
      <div
        className="pointer-events-none absolute left-0 top-[60%] h-px w-32"
        style={{
          background: 'linear-gradient(to right, transparent, var(--amber), transparent)',
          animation: 'game-shooting-star 9s linear infinite 3s',
        }}
      />

      {/* Contenedor principal con max-width centrado */}
      <div className="relative mx-auto max-w-md px-5 pt-6">

        {/* Header */}
        <header className="relative z-10 mb-2">
          <p
            className="font-sub text-xs uppercase tracking-widest"
            style={{ color: 'var(--amber)' }}
          >
            SEÑAL
          </p>
          <h1 className="text-cosmos-heading text-3xl leading-none">
            Universo Operativo
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(250,244,232,0.6)' }}>
            {userName}
          </p>

          {/* Barra de progreso global */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemax={templates.length}
              aria-label="Progreso del día"
            >
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(to right, var(--amber), var(--terracotta))',
                }}
              />
            </div>
            <span
              className="font-sub text-[10px] uppercase tracking-widest shrink-0"
              style={{ color: 'rgba(250,244,232,0.5)' }}
            >
              {completedCount}/{templates.length}
            </span>
          </div>
        </header>

        {/* Mapa de estrellas */}
        {isLoading ? (
          <LoadingState />
        ) : templates.length === 0 ? (
          <EmptyState />
        ) : (
          <StarMap
            planets={planetsData}
            selected={selected}
            onSelect={setSelected}
          />
        )}

        {/* Card inferior del planeta seleccionado */}
        {selectedData && (
          <SelectedPlanetCard
            data={selectedData}
            onClose={() => setSelected(null)}
            onNavigate={(path) => {
              setSelected(null)
              navigateTo(path)
            }}
          />
        )}
      </div>

      {/* Transición de salida */}
      {covering && (
        <CircleTransition direction="out" onDone={handleCoverDone} />
      )}
    </div>
  )
}

// ─── Mapa de estrellas ────────────────────────────────────────────────────────

type PlanetDatum = {
  template: FormTemplate
  pos: PlanetPos
  hue: number
  index: number
  status: 'complete' | 'current' | 'locked'
  isCompleted: boolean
}

function StarMap({
  planets,
  selected,
  onSelect,
}: {
  planets: PlanetDatum[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const W = 360
  const H = 520

  return (
    <div
      className="relative mx-auto mt-4 w-full"
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      {/* Nebulosas de fondo */}
      <div
        className="nebula"
        style={{
          left: '10%',
          top: '15%',
          width: '55%',
          height: '40%',
          background:
            'radial-gradient(circle, rgba(196,80,10,0.5), transparent 70%)',
        }}
      />
      <div
        className="nebula"
        style={{
          right: '5%',
          top: '55%',
          width: '60%',
          height: '45%',
          background:
            'radial-gradient(circle, rgba(100,60,200,0.45), transparent 70%)',
          animationDelay: '5s',
        }}
      />

      {/* SVG: líneas de constelación + estrellas dispersas */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Líneas entre planetas consecutivos */}
        {planets.slice(0, -1).map((p, i) => {
          const a = p.pos
          const b = planets[i + 1].pos
          const x1 = (a.x / 100) * W
          const y1 = (a.y / 100) * H
          const x2 = (b.x / 100) * W
          const y2 = (b.y / 100) * H
          const isActive = !p.isCompleted || !planets[i + 1].isCompleted
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? 'var(--amber)' : 'rgba(255,255,255,0.18)'}
              strokeWidth={isActive ? 1.5 : 1}
              strokeDasharray="3 5"
              strokeLinecap="round"
              style={
                isActive
                  ? { filter: 'drop-shadow(0 0 4px var(--amber))' }
                  : undefined
              }
              className="constellation-line"
              strokeDashoffset={100}
            />
          )
        })}

        {/* Estrellas dispersas */}
        {SCATTERED_STARS.map((s, i) => (
          <circle
            key={i}
            cx={(s.x / 100) * W}
            cy={(s.y / 100) * H}
            r={s.r}
            fill="var(--cream)"
            opacity={s.o}
          />
        ))}
      </svg>

      {/* Planetas */}
      {planets.map((p) => (
        <PlanetButton
          key={p.template.id}
          data={p}
          isSelected={selected === p.template.id}
          onSelect={() => onSelect(p.template.id)}
        />
      ))}
    </div>
  )
}

// ─── Botón planeta ────────────────────────────────────────────────────────────

function PlanetButton({
  data,
  isSelected,
  onSelect,
}: {
  data: PlanetDatum
  isSelected: boolean
  onSelect: () => void
}) {
  const { template, pos, hue, index, isCompleted } = data
  const locked = false // todos disponibles por ahora
  const fieldsCount = template.fields?.length ?? 1
  const completedCount = isCompleted ? fieldsCount : 0
  const pct = fieldsCount > 0 ? (completedCount / fieldsCount) * 100 : 0
  const inProgress = !isCompleted && !locked

  // Tamaño relativo al contenedor de 360 unidades lógicas
  const sizePct = (pos.size / 360) * 100
  const emoji = template.icon ?? '📋'

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group absolute focus:outline-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${sizePct}%`,
        aspectRatio: '1 / 1',
        transform: 'translate(-50%, -50%)',
        transition: 'transform 0.3s ease',
        animation: `game-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 120}ms both`,
      }}
      aria-label={template.name}
    >
      {/* Anillo de órbita con luna giratoria */}
      <div
        className="orbit-ring"
        style={{
          inset: '-14%',
          animation: `game-orbit-ring ${20 + index * 4}s linear infinite${
            index % 2 ? ' reverse' : ''
          }`,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: '8px',
            height: '8px',
            top: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--amber)',
            boxShadow: '0 0 8px var(--amber)',
          }}
        />
      </div>

      {/* Anillos de pulso — planeta activo */}
      {inProgress && (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-full border"
            style={{
              borderColor: 'var(--amber)',
              animation: 'game-pulse-ring 2.5s ease-out infinite',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full border"
            style={{
              borderColor: 'var(--amber)',
              animation: 'game-pulse-ring 2.5s ease-out infinite 1.25s',
            }}
          />
        </>
      )}

      {/* Cuerpo del planeta */}
      <div
        className="relative h-full w-full rounded-full"
        style={{
          transform: isSelected ? 'scale(1.1)' : undefined,
          transition: 'transform 0.3s ease',
          animation: `game-drift ${7 + index}s ease-in-out infinite`,
          animationDelay: `${index * 0.7}s`,
        }}
      >
        {/* Gradiente de superficie */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isCompleted
              ? 'radial-gradient(circle at 30% 28%, #4ade80, #22c55e 60%, #15803d)'
              : `radial-gradient(circle at 30% 28%, hsl(${hue} 70% 75%), hsl(${hue} 60% 45%) 60%, hsl(${hue} 50% 20%))`,
            boxShadow: `inset -10px -12px 24px rgba(0,0,0,0.4), 0 0 40px hsl(${hue} 60% 50% / 0.4), 0 14px 36px rgba(0,0,0,0.5)`,
          }}
        />

        {/* Textura de superficie */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            mixBlendMode: 'overlay',
            opacity: 0.4,
            background:
              'radial-gradient(ellipse at 65% 70%, rgba(0,0,0,0.5), transparent 50%), radial-gradient(circle at 20% 60%, rgba(255,255,255,0.2), transparent 30%)',
          }}
        />

        {/* Emoji */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            style={{ fontSize: `${pos.size * 0.32}px` }}
            className="drop-shadow-lg select-none"
          >
            {emoji}
          </span>
        </div>

        {/* Arco de progreso */}
        {pct > 0 && (
          <svg
            className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="var(--amber)"
              strokeWidth="2.5"
              strokeDasharray={`${(pct / 100) * 301.6} 301.6`}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px var(--amber))' }}
            />
          </svg>
        )}

        {/* Anillo de selección */}
        {isSelected && (
          <div
            className="pointer-events-none absolute rounded-full border-2"
            style={{
              inset: '-8px',
              borderColor: 'var(--amber)',
              boxShadow: '0 0 30px var(--amber)',
            }}
          />
        )}
      </div>

      {/* Etiqueta del planeta */}
      <div
        className="absolute left-1/2 text-center"
        style={{
          top: 'calc(100% + 8px)',
          transform: 'translateX(-50%)',
          width: 'max-content',
          maxWidth: '140px',
        }}
      >
        <p
          className="font-sub text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--cream)' }}
        >
          {template.name}
        </p>
      </div>
    </button>
  )
}

// ─── Card de planeta seleccionado (bottom sheet) ──────────────────────────────

function SelectedPlanetCard({
  data,
  onClose,
  onNavigate,
}: {
  data: PlanetDatum
  onClose: () => void
  onNavigate: (path: string) => void
}) {
  const { template, hue, isCompleted, status } = data
  const fieldsCount = template.fields?.length ?? 1
  const completedCount = isCompleted ? fieldsCount : 0
  const pct = fieldsCount > 0 ? (completedCount / fieldsCount) * 100 : 0
  const emoji = template.icon ?? '📋'

  const buttonLabel =
    status === 'complete'
      ? 'Revisar'
      : completedCount === 0
      ? 'Iniciar misión'
      : 'Continuar'

  return (
    <>
      {/* Backdrop para cerrar al tocar fuera */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar detalle"
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(11,15,26,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        key={template.id}
        className="card-glass fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md overflow-hidden rounded-t-3xl p-5 pb-8"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 60% 35% / 0.55), rgba(14,18,33,0.95))`,
          boxShadow: '0 -20px 50px rgba(0,0,0,0.5)',
          animation: 'game-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        {/* Drag handle */}
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full"
          style={{ background: 'rgba(250,244,232,0.3)' }}
        />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid place-items-center rounded-full text-lg font-bold leading-none transition-colors"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(250,244,232,0.1)',
            color: 'rgba(250,244,232,0.8)',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(250,244,232,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(250,244,232,0.1)'
          }}
          aria-label="Cerrar"
        >
          ×
        </button>

        {/* Contenido */}
        <div className="flex items-start gap-3 pr-8">
          <div style={{ fontSize: '2.25rem' }}>{emoji}</div>
          <div className="flex-1 min-w-0">
            <h2
              className="font-sub text-xl font-bold leading-tight truncate"
              style={{ color: 'var(--cream)' }}
            >
              {template.name}
            </h2>
            {template.description && (
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: 'rgba(250,244,232,0.7)' }}
              >
                {template.description}
              </p>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div
            className="mb-1 flex items-center justify-between text-[11px]"
            style={{ color: 'rgba(250,244,232,0.6)' }}
          >
            <span>
              {completedCount}/{fieldsCount} campos
            </span>
            <span
              className="font-bold"
              style={{ color: 'var(--amber)' }}
            >
              {isCompleted ? 'Completo' : `${Math.round(pct)}%`}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max(pct, isCompleted ? 100 : 0)}%`,
                background: 'linear-gradient(to right, var(--amber), var(--terracotta))',
              }}
            />
          </div>
        </div>

        {/* CTA o badge de completado */}
        {status === 'complete' ? (
          <div className="mt-5 flex items-center justify-center gap-2">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                background: 'rgba(74,222,128,0.15)',
                border: '1px solid rgba(74,222,128,0.4)',
                color: '#4ade80',
              }}
            >
              <span>✨</span>
              <span>Misión completada</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-3d btn-3d-primary mt-5 w-full"
            onClick={() => onNavigate(`/game/level/${template.id}`)}
          >
            {buttonLabel} →
          </button>
        )}
      </div>
    </>
  )
}

// ─── Estados auxiliares ───────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 mt-16"
      aria-live="polite"
    >
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}
      />
      <p className="text-sm" style={{ color: 'rgba(250,244,232,0.5)' }}>
        Cargando universo...
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 mt-16 text-center px-6">
      <span style={{ fontSize: '3rem' }}>🌌</span>
      <p
        className="font-sub font-bold text-lg"
        style={{ color: 'var(--cream)' }}
      >
        Sin misiones disponibles
      </p>
      <p className="text-sm" style={{ color: 'rgba(250,244,232,0.5)' }}>
        No hay formularios activos asignados en este momento.
      </p>
    </div>
  )
}
