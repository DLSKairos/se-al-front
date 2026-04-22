import { useLocation, useNavigate } from 'react-router-dom'
import { Map, FileText, Clock, Bell, User, type LucideIcon } from 'lucide-react'

interface Tab {
  label: string
  icon: LucideIcon
  path: string | null
}

const TABS: Tab[] = [
  { label: 'Inicio',   icon: Map,      path: '/' },
  { label: 'Permisos', icon: FileText, path: null },
  { label: 'Horas',    icon: Clock,    path: '/asistencia' },
  { label: 'Alertas',  icon: Bell,     path: null },
  { label: 'Perfil',   icon: User,     path: '/perfil' },
]

const HIDDEN_ROUTES = ['/login', '/location-select']
const HIDDEN_PREFIXES = [
  '/admin', '/super', '/form',
  '/game/level', '/game/rotate-screen', '/game/story-intro',
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const pathname = location.pathname

  const isHidden =
    HIDDEN_ROUTES.includes(pathname) ||
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isHidden) return null

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
        {TABS.map((tab) => {
          const isActive =
            tab.path !== null &&
            (pathname === tab.path ||
              (tab.path === '/' && pathname === '/game/world-map'))
          const isDisabled = tab.path === null

          const Icon = tab.icon

          if (isDisabled) {
            return (
              <div
                key={tab.label}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg opacity-40 cursor-not-allowed"
                aria-disabled="true"
                role="button"
                tabIndex={-1}
              >
                <Icon className="w-5 h-5 text-[var(--muted)]" />
                <span
                  className="text-[10px] font-['DM_Sans'] leading-none text-[var(--muted)]"
                >
                  {tab.label}
                </span>
                <div className="w-1 h-1" />
              </div>
            )
          }

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path!)}
              className={[
                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors',
                isActive
                  ? ''
                  : 'hover:text-[var(--off-white)]',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? 'var(--signal)' : 'var(--muted)' }}
              />
              <span
                className={[
                  'text-[10px] font-["DM_Sans"] leading-none',
                  isActive
                    ? 'text-[var(--signal)] font-semibold'
                    : 'text-[var(--muted)]',
                ].join(' ')}
              >
                {tab.label}
              </span>
              {isActive ? (
                <div className="w-1 h-1 rounded-full bg-[var(--signal)] mx-auto mt-1" />
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
