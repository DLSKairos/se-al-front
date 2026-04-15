import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Building2, LogOut, Radio } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function SuperAdminLayout() {
  const navigate = useNavigate()
  const clear = useAuthStore((s) => s.clear)

  return (
    <div className="min-h-screen bg-[var(--navy)] flex flex-col">
      <header className="h-14 flex items-center gap-4 px-6 border-b border-[var(--glass-border)] glass-card-md rounded-none">
        <Radio className="h-5 w-5 text-[var(--signal)] animate-pulse shrink-0" />
        <span className="font-display font-bold text-[var(--off-white)]">SEÑAL Super Admin</span>

        <div className="flex-1" />

        <NavLink
          to="/super"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-btn)] text-sm font-dm transition-colors ${
              isActive
                ? 'text-[var(--signal)] bg-[var(--signal-dim)]'
                : 'text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-secondary/50'
            }`
          }
        >
          <Building2 className="w-4 h-4" />
          Organizaciones
        </NavLink>

        <button
          onClick={() => {
            clear()
            navigate('/login')
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-btn)] text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-dm"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
