import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Map, FileText, Clock, User, Package, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { AttendanceRecord } from '@/types'
import { SlowConnectionBanner } from '@/components/ui/SlowConnectionBanner'
import { LiteModeBanner } from '@/components/ui/LiteModeBanner'

// ── Rutas donde se oculta el nav ──────────────────────────────────────────────

const NAV_HIDDEN_ROUTES = ['/login', '/location-select']
const NAV_HIDDEN_PREFIXES = [
  '/admin', '/super', '/form',
  '/game/level', '/game/rotate-screen', '/game/story-intro',
]

// ── Subcomponente: tab de jornada (posición 0) ────────────────────────────────

/**
 * JornadaTab muestra el estado de asistencia del día en la primera posición
 * del navbar:
 *   - Sin entrada: "Entrada" + punto rojo pulsante
 *   - Entrada sin salida: "Salida" + "Desde HH:MM" + punto verde
 *   - Ambas marcadas: check + horas del día
 */
function JornadaTab({ isActive }: { isActive: boolean }) {
  const navigate = useNavigate()

  const { data: record } = useQuery({
    queryKey: QK.attendance.today(),
    queryFn: () =>
      api
        .get<AttendanceRecord | null>('/attendance/today')
        .then((r) => r.data)
        .catch(() => null),
    // Refresca cada 60s para mantener el estado sincronizado sin ser invasivo
    staleTime: 60_000,
  })

  // ── Calcular estado de jornada ─────────────────────────────────────────
  const hasEntry = !!record
  const hasExit = hasEntry && !!record!.exit_time

  const entryTimeLabel = hasEntry
    ? new Date(record!.entry_time).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota',
      })
    : null

  // ── Render variantes ───────────────────────────────────────────────────

  return (
    <button
      type="button"
      onClick={() => navigate('/asistencia')}
      className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors min-w-0"
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icono + indicador de estado */}
      <div className="relative">
        <Clock
          className="w-5 h-5"
          style={{ color: isActive ? 'var(--signal)' : 'var(--muted)' }}
        />

        {/* Estado: sin entrada → punto rojo pulsante */}
        {!hasEntry && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#ef4444' }}
            aria-hidden="true"
          />
        )}

        {/* Estado: en jornada → punto verde */}
        {hasEntry && !hasExit && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#22c55e' }}
            aria-hidden="true"
          />
        )}

        {/* Estado: completa → check */}
        {hasExit && (
          <span className="absolute -top-1 -right-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
          </span>
        )}
      </div>

      {/* Etiqueta */}
      {!hasEntry && (
        <span
          className="text-[10px] font-['DM_Sans'] leading-none font-semibold"
          style={{ color: isActive ? 'var(--signal)' : 'var(--muted)' }}
        >
          Entrada
        </span>
      )}

      {hasEntry && !hasExit && (
        <>
          <span
            className="text-[10px] font-['DM_Sans'] leading-none font-semibold"
            style={{ color: isActive ? 'var(--signal)' : 'var(--muted)' }}
          >
            Salida
          </span>
          {entryTimeLabel && (
            <span
              className="text-[9px] font-['DM_Sans'] leading-none"
              style={{ color: 'var(--muted)' }}
            >
              {entryTimeLabel}
            </span>
          )}
        </>
      )}

      {hasExit && (
        <span
          className="text-[10px] font-['DM_Sans'] leading-none font-semibold"
          style={{ color: isActive ? 'var(--signal)' : 'var(--muted)' }}
        >
          Jornada
        </span>
      )}

      {/* Indicador activo */}
      {isActive ? (
        <div className="w-1 h-1 rounded-full bg-(--signal) mx-auto mt-1" />
      ) : (
        <div className="w-1 h-1" />
      )}
    </button>
  )
}

// ── Tabs estáticos (después de Jornada) ───────────────────────────────────────

interface StaticTab {
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  path: string
}

const STATIC_TABS: StaticTab[] = [
  { label: 'Inicio',      icon: Map,      path: '/' },
  { label: 'Permisos',    icon: FileText, path: '/permisos' },
  { label: 'Inventarios', icon: Package,  path: '/inventarios' },
  { label: 'Perfil',      icon: User,     path: '/perfil' },
]

// ── BottomNav del operario ────────────────────────────────────────────────────

function OperatorBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  const isNavHidden =
    NAV_HIDDEN_ROUTES.includes(pathname) ||
    NAV_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isNavHidden) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(0,212,255,0.1)]"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around px-2 h-14">
        {/* Tab 0: Jornada (siempre la primera) */}
        <JornadaTab isActive={pathname === '/asistencia'} />

        {/* Tabs 1-4: resto de navegación */}
        {STATIC_TABS.map((tab) => {
          const isActive =
            pathname === tab.path ||
            (tab.path === '/' && pathname === '/game/world-map') ||
            (tab.path !== '/' && pathname.startsWith(tab.path))

          const Icon = tab.icon

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? 'var(--signal)' : 'var(--muted)' }}
              />
              <span
                className={[
                  'text-[10px] font-["DM_Sans"] leading-none',
                  isActive ? 'font-semibold' : '',
                ].join(' ')}
                style={{ color: isActive ? 'var(--signal)' : 'var(--muted)' }}
              >
                {tab.label}
              </span>
              {isActive ? (
                <div
                  className="w-1 h-1 rounded-full mx-auto mt-1"
                  style={{ background: 'var(--signal)' }}
                />
              ) : (
                <div className="w-1 h-1" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ── Layout principal ──────────────────────────────────────────────────────────

export function OperatorLayout() {
  const [showLiteBanner, setShowLiteBanner] = useState(
    !sessionStorage.getItem('lite_banner_dismissed') &&
      !sessionStorage.getItem('lite_mode'),
  )

  const handleLiteIgnore = () => {
    sessionStorage.setItem('lite_banner_dismissed', '1')
    setShowLiteBanner(false)
  }

  const handleLiteActivate = () => {
    sessionStorage.setItem('lite_mode', 'true')
    sessionStorage.setItem('lite_banner_dismissed', '1')
    setShowLiteBanner(false)
  }

  return (
    <div className="min-h-screen bg-[var(--navy)] flex flex-col">
      <SlowConnectionBanner />
      <main className="flex-1 flex flex-col pb-20">
        <Outlet />
      </main>
      <OperatorBottomNav />
      {showLiteBanner && (
        <LiteModeBanner onIgnore={handleLiteIgnore} onActivate={handleLiteActivate} />
      )}
    </div>
  )
}
