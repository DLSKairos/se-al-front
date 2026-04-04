import React from "react";
import { NavLink } from "react-router-dom";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  Radio,
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  MessageSquare,
  ClipboardList,
  CheckSquare,
  Package,
  ShieldCheck,
  Wrench,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAdminRole } from "../hooks/useAdminRole";

/**
 * AdminSidebar — navegación lateral colapsable del panel admin.
 *
 * Props:
 *   collapsed   {boolean}    — estado controlado desde AdminLayout
 *   onToggle    {Function}   — callback para cambiar el estado collapsed
 *
 * Decisiones de diseño:
 *   - Ancho 240px expandido / 64px colapsado con transición suave.
 *   - En estado colapsado solo se muestran iconos; el texto usa opacity+width:0
 *     para que la transición sea fluida y no salte abruptamente.
 *   - Las secciones de formularios se muestran según el rol detectado.
 *   - NavLink activo recibe fondo signal-dim + borde izquierdo como indicador
 *     visual claro de ubicación.
 *   - overflow-y auto para listas largas en pantallas pequeñas.
 */

/* ─── Datos de navegación ─────────────────────────────── */

const MAIN_LINKS = [
  { to: "/admin",          label: "Dashboard",    Icon: LayoutDashboard },
  { to: "/admin/permisos", label: "Permisos",     Icon: FileText        },
  { to: "/admin/usuarios", label: "Usuarios",     Icon: Users           },
  { to: "/admin/obras",    label: "Obras",        Icon: Building2       },
  { to: "/admin/chat",     label: "Señal IA",     Icon: MessageSquare   },
];

const GRUAMAN_LINKS = [
  { to: "/chequeo_torregruas_admin",  label: "Chequeo Torre Grúa",  Icon: ClipboardList },
  { to: "/chequeo_elevador_admin",    label: "Chequeo Elevador",    Icon: CheckSquare   },
  { to: "/inspeccion_EPCC_admins",    label: "Insp. EPCC",          Icon: ShieldCheck   },
  { to: "/inspeccion_izaje_admin",    label: "Insp. Izaje",         Icon: Sparkles      },
  { to: "/admin_horas_extra_gruaman", label: "Horas Extra",         Icon: Clock         },
];

const BOMBERMAN_LINKS = [
  { to: "/planilla_bombeo_admin",              label: "Planilla Bombeo", Icon: ClipboardList },
  { to: "/checklist_admin",                    label: "Checklist",       Icon: CheckSquare   },
  { to: "/inventarios_obra_admin",             label: "Inventarios",     Icon: Package       },
  { to: "/inspeccion_epcc_bomberman_admin",    label: "Insp. EPCC",      Icon: ShieldCheck   },
  { to: "/herramientas_mantenimiento_admin",   label: "Herramientas",    Icon: Wrench        },
  { to: "/kit_limpieza_admin",                 label: "Kit Limpieza",    Icon: Sparkles      },
  { to: "/admin_horas_extra_bomberman",        label: "Horas Extra",     Icon: Clock         },
];

/* ─── Sub-componentes ─────────────────────────────────── */

function SectionLabel({ label, collapsed }) {
  return (
    <div
      style={{
        padding: collapsed ? "12px 0 4px" : "12px 16px 4px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        color: "var(--muted)",
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: "padding 0.25s ease, opacity 0.2s ease",
        opacity: collapsed ? 0 : 1,
        height: collapsed ? 0 : "auto",
      }}
    >
      {label}
    </div>
  );
}

function SidebarLink({ to, label, Icon, collapsed, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "10px 0" : "10px 14px",
        borderRadius: 10,
        margin: "2px 8px",
        textDecoration: "none",
        color: isActive ? "var(--signal)" : "var(--muted)",
        background: isActive ? "var(--signal-dim)" : "transparent",
        borderLeft: isActive ? "2px solid var(--signal)" : "2px solid transparent",
        transition: "all 0.2s ease",
        justifyContent: collapsed ? "center" : "flex-start",
        overflow: "hidden",
        whiteSpace: "nowrap",
        minHeight: 44,
      })}
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <span
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              color: isActive ? "var(--signal)" : "var(--muted)",
              transition: "color 0.2s",
            }}
          >
            <Icon size={18} strokeWidth={1.75} />
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: isActive ? 600 : 400,
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 180,
              overflow: "hidden",
              transition: "opacity 0.2s ease, max-width 0.25s ease",
            }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

/* ─── Componente principal ────────────────────────────── */

function AdminSidebar({ collapsed, onToggle }) {
  const { rol } = useAdminRole();

  const formLinks =
    rol === "gruaman"
      ? GRUAMAN_LINKS
      : rol === "bomberman"
      ? BOMBERMAN_LINKS
      : [];

  return (
    <aside
      style={{
        gridRow: "1 / 3",
        gridColumn: "1",
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        background: "var(--navy-mid)",
        borderRight: "1px solid var(--glass-border)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
        zIndex: 10,
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "0" : "0 16px",
          gap: 10,
          borderBottom: "1px solid var(--glass-border)",
          flexShrink: 0,
          overflow: "hidden",
          transition: "padding 0.25s ease, justify-content 0.25s ease",
        }}
      >
        <span style={{ color: "var(--signal)", flexShrink: 0, display: "flex" }}>
          <Radio size={22} strokeWidth={1.75} />
        </span>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "2px",
            color: "var(--off-white)",
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 120,
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "opacity 0.2s ease, max-width 0.25s ease",
          }}
        >
          SEÑAL
        </span>
      </div>

      {/* ── Navegación principal ── */}
      <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
        <SectionLabel label="Principal" collapsed={collapsed} />

        {MAIN_LINKS.map(({ to, label, Icon }) => (
          <SidebarLink
            key={to}
            to={to}
            label={label}
            Icon={Icon}
            collapsed={collapsed}
            end={to === "/admin"}
          />
        ))}

        {/* ── Sección Formularios (condicional por rol) ── */}
        {formLinks.length > 0 && (
          <>
            <SectionLabel label="Formularios" collapsed={collapsed} />
            {formLinks.map(({ to, label, Icon }) => (
              <SidebarLink
                key={to}
                to={to}
                label={label}
                Icon={Icon}
                collapsed={collapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── Indicador de rol al pie ── */}
      {!collapsed && rol && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--glass-border)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: rol === "gruaman" ? "var(--signal)" : "var(--amber)",
              background:
                rol === "gruaman" ? "var(--signal-dim)" : "var(--amber-dim)",
              border: `1px solid ${rol === "gruaman" ? "var(--glass-border)" : "rgba(245,166,35,0.25)"}`,
              borderRadius: "var(--radius-badge, 4px)",
              padding: "3px 8px",
            }}
          >
            {rol}
          </span>
        </div>
      )}
    </aside>
  );
}

export default AdminSidebar;
