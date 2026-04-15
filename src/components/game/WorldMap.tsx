/**
 * WorldMap — mapa de mundos estilo Mario Bros
 * Los templates se cargan dinámicamente desde GET /form-templates (activos del operario).
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { getCompletedWorlds, computeWorldStatus, markWorldComplete } from '@/db/gameProgress'
import WorldNode        from './WorldNode'
import CircleTransition from './CircleTransition'
import { FormTemplate } from '@/types'

const TUTORIAL_KEY = 'game_tutorial_seen'
const ZIGZAG       = ['right', 'left', 'center'] as const
const POS_X        = { right: '83%', left: '13%', center: '50%' } as const

type ZigZag = typeof ZIGZAG[number]

export default function WorldMap() {
  const navigate = useNavigate()
  const { user, workLocationId } = useAuthStore()

  const cedula = user?.sub ?? 'anon'
  const obraId = workLocationId ?? '0'

  const { data: templates = [], isLoading } = useQuery({
    queryKey: QK.templates.active(),
    queryFn:  () => api.get<FormTemplate[]>('/form-templates/active').then((r) => r.data),
  })

  const [completedIds, setCompletedIds] = useState<string[]>([])

  useEffect(() => {
    setCompletedIds(getCompletedWorlds(cedula, obraId))
  }, [cedula, obraId])

  // Detectar si el usuario volvió del nivel (game_mode en localStorage)
  useEffect(() => {
    const worldId = localStorage.getItem('game_mode')
    if (worldId) {
      localStorage.removeItem('game_mode')
      markWorldComplete(cedula, obraId, worldId)
      setCompletedIds(getCompletedWorlds(cedula, obraId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completedCount = completedIds.length

  const [imgError,     setImgError]    = useState(false)
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem(TUTORIAL_KEY))
  const tutorialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissTutorial = () => {
    setShowTutorial(false)
    try { localStorage.setItem(TUTORIAL_KEY, '1') } catch { /* quota exceeded */ }
    if (tutorialTimerRef.current) clearTimeout(tutorialTimerRef.current)
  }

  useEffect(() => {
    if (!showTutorial) return
    tutorialTimerRef.current = setTimeout(dismissTutorial, 6000)
    return () => {
      if (tutorialTimerRef.current) clearTimeout(tutorialTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTutorial])

  const [covering,    setCovering]    = useState(false)
  const [destination, setDestination] = useState<string | null>(null)

  const navigateTo = (path: string) => {
    setDestination(path)
    setCovering(true)
  }

  const handleCoverDone = () => {
    if (destination) navigate(destination)
  }

  const progressPct = templates.length > 0
    ? (completedCount / templates.length) * 100
    : 0

  const character     = localStorage.getItem('selectedCharacter') || 'trabajador'
  const userName      = localStorage.getItem('nombre_trabajador')  || user?.sub || 'Operario'
  const characterName = localStorage.getItem('cargo_trabajador')  || user?.jobTitle || 'Operario'

  return (
    <div
      className="min-h-screen bg-[var(--navy)] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-6 pt-12 pb-4">
        <div className="shrink-0">
          {!imgError ? (
            <img
              src={`/assets/${character}-idle.png`}
              alt={characterName}
              className="w-10 h-10 object-contain rounded-full border border-[var(--signal)]/30"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-3xl" aria-hidden="true">👷</span>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-display font-extrabold text-xl text-[var(--off-white)] truncate">
            {userName}
          </span>
          <span className="text-xs text-[var(--signal)] font-['DM_Sans'] truncate">
            {characterName}
          </span>
        </div>

        <div className="ml-auto flex flex-col items-end gap-1 min-w-[100px]">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)]">
            {completedCount}/{templates.length} misiones
          </span>
          <div
            className="w-24 h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemax={templates.length}
            aria-label="Progreso del día"
          >
            <div
              className="h-full bg-[var(--signal)] rounded-full transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Tutorial tooltip */}
      {showTutorial && templates.length > 0 && (
        <div
          className="relative z-20 mx-4 glass p-4 rounded-[16px] flex items-start gap-2"
          role="status"
        >
          <div className="flex-1">
            <p className="text-sm text-[var(--off-white)] font-['DM_Sans'] m-0">
              ¡Hola, <strong>{characterName}</strong>! 👋
            </p>
            <p className="text-xs text-[var(--muted)] font-['DM_Sans'] m-0 mt-0.5">
              Empieza la misión por aquí 👇
            </p>
          </div>
          <button
            className="shrink-0 text-[var(--muted)] hover:text-[var(--off-white)] text-lg leading-none p-0 border-0 bg-transparent"
            onClick={dismissTutorial}
            aria-label="Cerrar tutorial"
          >
            ✕
          </button>
        </div>
      )}

      {/* Scrollable track */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--signal)] border-t-transparent animate-spin" />
            <p className="text-sm text-[var(--muted)] font-['DM_Sans']">Cargando misiones...</p>
          </div>
        ) : (
          <div className="relative w-full py-4" style={{ minHeight: `${templates.length * 96 + 80}px` }}>
            {templates.map((template, index) => {
              const pos     = ZIGZAG[index % ZIGZAG.length] as ZigZag
              const posNext = ZIGZAG[(index + 1) % ZIGZAG.length] as ZigZag

              return [
                <div
                  key={template.id}
                  className="absolute"
                  style={{
                    top:       `${index * 96}px`,
                    left:      pos === 'right' ? 'auto' : pos === 'left' ? '5%' : '50%',
                    right:     pos === 'right' ? '5%' : 'auto',
                    transform: pos === 'center' ? 'translateX(-50%)' : undefined,
                  }}
                >
                  <WorldNode
                    world={{
                      id:    template.id,
                      name:  template.name,
                      icon:  template.icon,
                      order: index + 1,
                    }}
                    status={computeWorldStatus(template.id, cedula, obraId)}
                    isHighlighted={index === 0 && showTutorial}
                    onClick={(id) => navigateTo(`/game/level/${id}`)}
                  />
                </div>,

                index < templates.length - 1 && (
                  <svg
                    key={`conn-${template.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      top:    `${index * 96 + 80}px`,
                      left:   0,
                      width:  '100%',
                      height: '48px',
                    }}
                    width="100%"
                    height="48"
                    aria-hidden="true"
                  >
                    <line
                      x1={POS_X[pos]}     y1="0"
                      x2={POS_X[posNext]} y2="48"
                      stroke="rgba(0,212,255,0.2)"
                      strokeWidth="3"
                      strokeDasharray="8 5"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              ]
            }).flat().filter(Boolean)}

            {/* Finish flag */}
            {templates.length > 0 && (
              <div
                className="absolute"
                style={{
                  top:       `${templates.length * 96}px`,
                  left:      ZIGZAG[templates.length % ZIGZAG.length] === 'right' ? 'auto' : ZIGZAG[templates.length % ZIGZAG.length] === 'left' ? '5%' : '50%',
                  right:     ZIGZAG[templates.length % ZIGZAG.length] === 'right' ? '5%' : 'auto',
                  transform: ZIGZAG[templates.length % ZIGZAG.length] === 'center' ? 'translateX(-50%)' : undefined,
                }}
                aria-label="Meta final"
              >
                <span className="text-4xl">🏁</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-3 border-t border-white/10">
        <button
          className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--signal)] transition-colors font-['DM_Sans']"
          onClick={() => navigateTo('/bienvenida')}
        >
          ← Salir
        </button>
      </footer>

      {covering && (
        <CircleTransition direction="out" onDone={handleCoverDone} />
      )}
    </div>
  )
}
