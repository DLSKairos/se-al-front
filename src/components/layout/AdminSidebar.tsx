import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  FileText,
  Users,
  MapPin,
  Building2,
  Tags,
  Clock,
  Settings,
  Webhook,
  Bell,
  MessageSquare,
  Plus,
  LogOut,
  Radio,
} from 'lucide-react'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { FormTemplate } from '@/types'

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const linkBase =
  "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-btn)] text-sm font-['DM_Sans'] transition-all duration-150 text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-secondary/50"
const linkActive =
  'text-[var(--signal)] bg-[var(--signal-dim)] font-medium'

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const navigate = useNavigate()
  const clear = useAuthStore((s) => s.clear)
  const user = useAuthStore((s) => s.user)

  const { data: templates = [] } = useQuery({
    queryKey: QK.templates.admin(),
    queryFn: () => api.get<FormTemplate[]>('/form-templates/admin').then((r) => r.data),
    staleTime: 30_000,
  })

  const visibleTemplates = templates.filter((t) => t.status !== 'ARCHIVED')

  const handleLogout = () => {
    clear()
    navigate('/login')
  }

  return (
    <aside
      className={`flex flex-col h-screen bg-[var(--navy-mid)] border-r border-white/5 transition-all duration-250 shrink-0 overflow-hidden ${
        collapsed ? 'w-12' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 shrink-0">
        <Radio className="h-6 w-6 text-[var(--signal)] shrink-0 animate-pulse" />
        {!collapsed && (
          <span className="font-display font-bold text-[var(--off-white)] text-base tracking-wide">
            SEÑAL
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 flex flex-col gap-1">
        {/* Dashboard */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* Chat IA */}
        <NavLink
          to="/admin/chat"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
          title={collapsed ? 'Asistente IA' : undefined}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Asistente IA</span>}
        </NavLink>

        {/* Seccion Formularios */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest px-3 pt-4 pb-1">
            Formularios
          </p>
        )}

        <NavLink
          to="/admin/formularios/nuevo"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
          title={collapsed ? 'Crear formulario' : undefined}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-[var(--signal)]">Crear formulario</span>}
        </NavLink>

        {visibleTemplates.map((t) => (
          <NavLink
            key={t.id}
            to={`/admin/formularios/${t.id}/submissions`}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
            title={collapsed ? t.name : undefined}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                t.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {!collapsed && <span className="truncate text-xs">{t.name}</span>}
          </NavLink>
        ))}

        <NavLink
          to="/admin/formularios"
          end
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
          title={collapsed ? 'Todos los formularios' : undefined}
        >
          <FileText className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs text-[var(--muted)]">Ver todos</span>}
        </NavLink>

        {/* Seccion Configuracion */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest px-3 pt-4 pb-1">
            Configuracion
          </p>
        )}

        {(
          [
            { to: '/admin/usuarios',     icon: Users,    label: 'Usuarios'      },
            { to: '/admin/ubicaciones',  icon: MapPin,   label: 'Ubicaciones'   },
            { to: '/admin/departamentos',icon: Building2,label: 'Departamentos' },
            { to: '/admin/categorias',   icon: Tags,     label: 'Categorias'    },
            { to: '/admin/asistencia',   icon: Clock,    label: 'Asistencia'    },
          ] as const
        ).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Seccion Sistema */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest px-3 pt-4 pb-1">
            Sistema
          </p>
        )}

        {(
          [
            { to: '/admin/configuracion',                         icon: Settings, label: 'Organizacion' },
            { to: '/admin/configuracion/webhooks',                icon: Webhook,  label: 'Webhooks'     },
            { to: '/admin/configuracion/notificaciones-push',     icon: Bell,     label: 'Push'         },
          ] as const
        ).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: rol + logout */}
      <div className="border-t border-white/5 p-3 shrink-0">
        {!collapsed && user && (
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2 px-1 truncate">
            {user.role}
          </p>
        )}
        <button
          onClick={handleLogout}
          className={`${linkBase} w-full text-red-400 hover:text-red-300 hover:bg-red-500/10`}
          title={collapsed ? 'Cerrar sesion' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar sesion</span>}
        </button>
      </div>
    </aside>
  )
}
