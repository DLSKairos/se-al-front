import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  AlertTriangle,
  Megaphone,
  FileCheck,
  Inbox,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket'
import { useClickOutside } from '@/hooks/useClickOutside'
import { relativeTime } from '@/lib/relativeTime'
import type { AppNotification, NotificationType } from '@/types'

// ── Icono por tipo ───────────────────────────────────────────────────────────

interface TypeConfig {
  Icon: React.ElementType
  color: string
  bg: string
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  FORM_APPROVED: {
    Icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
  FORM_REJECTED: {
    Icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
  },
  FORM_PENDING_SIGNATURE: {
    Icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  FORM_SUBMITTED: {
    Icon: FileCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
  },
  MAGIC_LINK_SENT: {
    Icon: Link2,
    color: 'text-[var(--signal)]',
    bg: 'bg-[rgba(0,212,255,0.12)]',
  },
  SYSTEM_ALERT: {
    Icon: AlertTriangle,
    color: 'text-amber-300',
    bg: 'bg-amber-400/10',
  },
  CUSTOM_ADMIN: {
    Icon: Megaphone,
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
  },
}

// ── Tarjeta de notificación ──────────────────────────────────────────────────

interface NotificationCardProps {
  notification: AppNotification
  onTap: (n: AppNotification) => void
  /** Tamaño grande para el drawer del operario */
  large?: boolean
}

function NotificationCard({ notification: n, onTap, large = false }: NotificationCardProps) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM_ALERT
  const Icon = cfg.Icon

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTap(n)
    }
  }

  if (large) {
    // Vista operario — tarjeta grande, tap en toda la superficie
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${n.read ? '' : 'No leída: '}${n.title}`}
        onClick={() => onTap(n)}
        onKeyDown={handleKeyDown}
        className={`
          flex items-start gap-5 p-5 rounded-[var(--radius-glass)] cursor-pointer transition-all
          active:scale-[0.97] select-none min-h-[80px]
          ${n.read
            ? 'bg-[rgba(255,255,255,0.03)] border border-white/5'
            : 'bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.18)]'
          }
        `}
      >
        {/* Icono grande */}
        <div className={`shrink-0 w-14 h-14 rounded-[var(--radius-glass-md)] flex items-center justify-center ${cfg.bg}`}>
          <Icon className={`w-7 h-7 ${cfg.color}`} aria-hidden="true" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-['Syne'] font-semibold text-base leading-snug ${n.read ? 'text-[var(--off-white)]/80' : 'text-[var(--off-white)]'}`}>
              {n.title}
            </p>
            {!n.read && (
              <span
                aria-label="No leída"
                className="shrink-0 w-2.5 h-2.5 mt-1 rounded-full bg-[var(--signal)]"
              />
            )}
          </div>
          <p className="text-sm text-[var(--muted)] mt-1 font-['DM_Sans'] line-clamp-2">
            {n.body}
          </p>
          <p className="text-xs text-[var(--muted)]/60 mt-2 font-['DM_Sans']">
            {relativeTime(n.created_at)}
          </p>
        </div>
      </div>
    )
  }

  // Vista admin — fila compacta
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${n.read ? '' : 'No leída: '}${n.title}`}
      onClick={() => onTap(n)}
      onKeyDown={handleKeyDown}
      className={`
        flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
        hover:bg-white/[0.03] select-none
        ${n.read ? '' : 'bg-[rgba(0,212,255,0.04)]'}
      `}
    >
      {/* Icono pequeño */}
      <div className={`shrink-0 w-8 h-8 rounded-[var(--radius-glass-md)] flex items-center justify-center ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} aria-hidden="true" />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          <p className={`text-sm font-semibold font-['DM_Sans'] leading-snug flex-1 ${n.read ? 'text-[var(--off-white)]/70' : 'text-[var(--off-white)]'}`}>
            {n.title}
          </p>
          {!n.read && (
            <span
              aria-label="No leída"
              className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[var(--signal)]"
            />
          )}
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5 font-['DM_Sans'] line-clamp-2">
          {n.body}
        </p>
        <p className="text-xs text-[var(--muted)]/50 mt-0.5 font-['DM_Sans']">
          {relativeTime(n.created_at)}
        </p>
      </div>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function NotificationSkeleton({ large = false }: { large?: boolean }) {
  if (large) {
    return (
      <div className="flex items-start gap-5 p-5 rounded-[var(--radius-glass)] border border-white/5 animate-pulse">
        <div className="shrink-0 w-14 h-14 rounded-[var(--radius-glass-md)] bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="shrink-0 w-8 h-8 rounded-[var(--radius-glass-md)] bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2.5 bg-white/5 rounded w-full" />
      </div>
    </div>
  )
}

// ── Badge de contador ────────────────────────────────────────────────────────

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      aria-label={`${count > 99 ? '99+' : count} notificaciones sin leer`}
      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[var(--signal)] text-[var(--navy)] text-[9px] font-bold font-['DM_Sans'] px-1 leading-none shadow-[0_0_0_2px_var(--navy-mid)]"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ── Drawer del operario (pantalla completa) ──────────────────────────────────

interface OperatorDrawerProps {
  open: boolean
  onClose: () => void
}

function OperatorDrawer({ open, onClose }: OperatorDrawerProps) {
  const navigate = useNavigate()
  const {
    notifications,
    isLoading,
    isError,
    unreadCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  } = useNotifications()

  // Cerrar con Escape
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  function handleTap(n: AppNotification) {
    if (!n.read) markAsRead(n.id)
    if (n.deep_link) {
      navigate(n.deep_link)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Centro de notificaciones"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 top-0 z-50 flex flex-col bg-[var(--navy)] max-w-full"
            style={{ background: 'linear-gradient(180deg, #111E30 0%, #0C1624 100%)' }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between px-5 pt-safe-top pb-4 pt-6 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold text-[var(--off-white)] font-['Syne']">
                  Notificaciones
                </h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-[var(--muted)] font-['DM_Sans'] mt-0.5">
                    {unreadCount} sin leer
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    disabled={isMarkingAll}
                    aria-label="Marcar todas como leídas"
                    className="flex items-center gap-2 text-sm text-[var(--signal)] font-['DM_Sans'] font-medium px-3 py-2 rounded-[var(--radius-btn)] hover:bg-[rgba(0,212,255,0.08)] transition-colors min-h-[48px] disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" aria-hidden="true" />
                    Todas leídas
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar notificaciones"
                  className="w-12 h-12 flex items-center justify-center rounded-[var(--radius-btn)] text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-white/5 transition-colors"
                >
                  <ChevronDown className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              role="list"
              aria-label="Lista de notificaciones"
            >
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <NotificationSkeleton key={i} large />
                ))
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <AlertTriangle className="w-12 h-12 text-amber-400/60" aria-hidden="true" />
                  <p className="text-[var(--muted)] text-center font-['DM_Sans']">
                    No se pudieron cargar las notificaciones
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Inbox className="w-16 h-16 text-[var(--muted)]/40" aria-hidden="true" />
                  <p className="text-[var(--off-white)]/60 text-lg text-center font-['DM_Sans']">
                    No tienes notificaciones
                  </p>
                  <p className="text-[var(--muted)] text-sm text-center font-['DM_Sans']">
                    Te avisaremos cuando haya algo importante
                  </p>
                </div>
              ) : (
                <>
                  {notifications.map((n) => (
                    <div key={n.id} role="listitem">
                      <NotificationCard
                        notification={n}
                        onTap={handleTap}
                        large
                      />
                    </div>
                  ))}

                  {/* Cargar más */}
                  {hasNextPage && (
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="w-full py-4 text-sm text-[var(--signal)] font-['DM_Sans'] font-medium text-center rounded-[var(--radius-btn)] hover:bg-[rgba(0,212,255,0.06)] transition-colors disabled:opacity-50 min-h-[48px]"
                    >
                      {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Dropdown del admin ───────────────────────────────────────────────────────

interface AdminDropdownProps {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

function AdminDropdown({ open, onClose, anchorRef }: AdminDropdownProps) {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  const {
    notifications,
    isLoading,
    isError,
    unreadCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  } = useNotifications()

  // Calcular posición del dropdown desde el botón anchor
  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
  }, [open, anchorRef])

  // Cerrar con click fuera (el botón ancla detiene su propio mousedown, ver
  // NotificationBell más abajo, para evitar que se cierre y reabra a la vez)
  useClickOutside(dropdownRef, onClose, open)

  // Cerrar con Escape
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        anchorRef.current?.focus()
      }
    }

    if (open) {
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, anchorRef])

  // Foco al abrir
  useEffect(() => {
    if (open) {
      const timerId = setTimeout(() => dropdownRef.current?.focus(), 50)
      return () => clearTimeout(timerId)
    }
  }, [open])

  function handleTap(n: AppNotification) {
    if (!n.read) markAsRead(n.id)
    if (n.deep_link) {
      navigate(n.deep_link)
      onClose()
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={dropdownRef}
          key="admin-dropdown"
          role="dialog"
          aria-modal="true"
          aria-label="Centro de notificaciones"
          tabIndex={-1}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.13, ease: 'easeOut' }}
          className="fixed w-[380px] max-w-[calc(100vw-2rem)] z-[9999] rounded-[var(--radius-glass)] shadow-glass border border-white/[0.07] flex flex-col overflow-hidden focus:outline-none"
          style={{
            top: pos.top,
            right: pos.right,
            background: 'linear-gradient(160deg, #162238 0%, #0E1A2C 100%)',
          }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[var(--signal)]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-[var(--off-white)] font-['Syne'] tracking-wide">
                Notificaciones
              </h2>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium text-[var(--navy)] bg-[var(--signal)] rounded-full px-1.5 py-0.5 leading-none font-['DM_Sans']">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAll}
                aria-label="Marcar todas como leídas"
                className="flex items-center gap-1.5 text-xs text-[var(--signal)]/80 hover:text-[var(--signal)] font-['DM_Sans'] px-2 py-1 rounded-md hover:bg-[rgba(0,212,255,0.08)] transition-all disabled:opacity-40"
              >
                <CheckCheck className="w-3 h-3" aria-hidden="true" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista con scroll */}
          <div
            className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-white/[0.03]"
            role="list"
            aria-label="Lista de notificaciones"
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-400/60" aria-hidden="true" />
                <p className="text-sm text-[var(--muted)] text-center font-['DM_Sans']">
                  Error al cargar notificaciones
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Inbox className="w-10 h-10 text-[var(--muted)]/40" aria-hidden="true" />
                <p className="text-sm text-[var(--muted)] text-center font-['DM_Sans']">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <div key={n.id} role="listitem">
                    <NotificationCard notification={n} onTap={handleTap} />
                  </div>
                ))}

                {hasNextPage && (
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full py-3 text-xs text-[var(--signal)] font-['DM_Sans'] text-center hover:bg-white/[0.02] transition-colors disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

/**
 * NotificationBell — campanita autocontenida con badge y panel de notificaciones.
 *
 * - Sin props obligatorias: se monta como <NotificationBell /> en cualquier layout.
 * - Conecta el socket de tiempo real al montar.
 * - OPERATOR → drawer pantalla completa (Framer Motion slide-in desde abajo).
 * - ADMIN / SUPER_ADMIN → dropdown anclado de 400px.
 *
 * Export: export default NotificationBell
 */
export default function NotificationBell() {
  const { user, isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { unreadCount } = useNotifications()

  // Conectar socket en tiempo real
  useNotificationsSocket()

  const isOperator = user?.role === 'OPERATOR'

  function handleButtonClick(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    setOpen((prev) => !prev)
  }

  const handleClose = useCallback(() => setOpen(false), [])

  if (!isAuthenticated()) return null

  return (
    <div className="relative" data-testid="notification-bell">
      {/* Botón de la campanita */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount > 99 ? '99+' : unreadCount} sin leer`
            : 'Notificaciones'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`
          relative w-9 h-9 flex items-center justify-center rounded-full transition-all
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--navy-mid)]
          ${open
            ? 'bg-[rgba(0,212,255,0.12)] text-[var(--signal)]'
            : 'text-[var(--off-white)]/60 hover:text-[var(--off-white)] hover:bg-white/[0.06]'
          }
        `}
      >
        <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
        <UnreadBadge count={unreadCount} />
      </button>

      {/* Panel según rol */}
      {isOperator ? (
        <OperatorDrawer open={open} onClose={handleClose} />
      ) : (
        <AdminDropdown
          open={open}
          onClose={handleClose}
          anchorRef={buttonRef}
        />
      )}
    </div>
  )
}
