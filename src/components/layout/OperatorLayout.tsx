import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Map, FileText, Clock, User, Package, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { AttendanceRecord } from '@/types'
import { SlowConnectionBanner } from '@/components/ui/SlowConnectionBanner'
import { LiteModeBanner } from '@/components/ui/LiteModeBanner'
import NotificationBell from '@/components/notifications/NotificationBell'

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

  const label = !hasEntry ? 'Entrada' : !hasExit ? 'Salida' : 'Jornada'

  return (
    <TabButton
      label={label}
      sub={hasEntry && !hasExit ? entryTimeLabel : null}
      isActive={isActive}
      onClick={() => navigate('/asistencia')}
      icon={
        <span className="relative">
          <Clock className="w-[26px] h-[26px]" aria-hidden="true" />
          {!hasEntry && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--danger)] ring-2 ring-[var(--liquid-edge)] animate-pulse" aria-hidden="true" />
          )}
          {hasEntry && !hasExit && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--ok)] ring-2 ring-[var(--liquid-edge)] animate-pulse" aria-hidden="true" />
          )}
          {hasExit && (
            <CheckCircle className="absolute -top-1.5 -right-2 w-4 h-4 text-[var(--ok)] bg-[var(--surface)] rounded-full" aria-hidden="true" />
          )}
        </span>
      }
    />
  )
}

/** Tab de la barra inferior: objetivo táctil de 64 px con pastilla amarilla cuando está activo. */
function TabButton({
  label,
  sub,
  icon,
  isActive,
  onClick,
}: {
  label: string
  sub?: string | null
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'relative flex-1 min-w-0 h-16 flex flex-col items-center justify-center gap-0.5 rounded-[20px] transition-[background-color,color,transform] duration-200 ease-[var(--ease-out)] active:scale-[0.94]',
        isActive
          ? 'bg-[var(--brand)] text-[var(--on-brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_10px_-4px_rgba(168,127,0,0.6)]'
          : 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
      ].join(' ')}
    >
      {icon}
      <span className="text-[12px] min-[360px]:text-[13px] tracking-tight font-body font-bold leading-none max-w-full">{label}</span>
      {sub && <span className="text-[11px] leading-none font-medium opacity-80 -mt-0.5">{sub}</span>}
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
  { label: 'Ruta',        icon: Map,      path: '/' },
  { label: 'Permisos',    icon: FileText, path: '/permisos' },
  { label: 'Inventario',  icon: Package,  path: '/inventarios' },
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
      className="fixed inset-x-0 bottom-0 z-40 px-3 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
      aria-label="Navegación principal"
    >
      <div className="liquid pointer-events-auto mx-auto max-w-md flex items-stretch gap-0.5 min-[360px]:gap-1 p-1 min-[360px]:p-1.5 rounded-[28px]">
        <JornadaTab isActive={pathname === '/asistencia'} />

        {STATIC_TABS.map((tab) => {
          const isActive =
            pathname === tab.path ||
            (tab.path === '/' && pathname === '/game/world-map') ||
            (tab.path !== '/' && pathname.startsWith(tab.path))
          const Icon = tab.icon
          return (
            <TabButton
              key={tab.label}
              label={tab.label}
              isActive={isActive}
              onClick={() => navigate(tab.path)}
              icon={<Icon className="w-[26px] h-[26px]" />}
            />
          )
        })}
      </div>
    </nav>
  )
}

// ── Campanita flotante del operario ───────────────────────────────────────────

function OperatorNotificationBell() {
  const { pathname } = useLocation()

  const hidden =
    NAV_HIDDEN_ROUTES.includes(pathname) ||
    NAV_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (hidden) return null

  return (
    <div
      className="fixed right-3 z-40"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <NotificationBell />
    </div>
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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <SlowConnectionBanner />
      <OperatorNotificationBell />
      <main className="flex-1 flex flex-col pb-32">
        <Outlet />
      </main>
      <OperatorBottomNav />
      {showLiteBanner && (
        <LiteModeBanner onIgnore={handleLiteIgnore} onActivate={handleLiteActivate} />
      )}
    </div>
  )
}
