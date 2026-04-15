import { Menu } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface AdminHeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
}

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Administrador',
  OPERATOR:    'Operario',
}

export function AdminHeader({ collapsed, onToggleSidebar }: AdminHeaderProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-[var(--glass-border)] glass-card-md rounded-none shrink-0">
      <button
        onClick={onToggleSidebar}
        className="text-[var(--muted)] hover:text-[var(--off-white)] transition-colors p-1.5 rounded-lg hover:bg-[var(--signal-dim)]"
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <Menu className="w-4 h-4" />
      </button>

      <span className="ml-2 font-display font-semibold text-sm text-[var(--muted)]">Panel de Administración</span>
      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] font-['DM_Sans'] hidden sm:block">
            {roleLabel[user.role] ?? user.role}
          </span>
          <div className="w-7 h-7 rounded-full bg-[var(--signal-dim)] border border-[var(--signal)]/30 flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--signal)] font-['Syne']">
              {user.role[0]}
            </span>
          </div>
        </div>
      )}
    </header>
  )
}
