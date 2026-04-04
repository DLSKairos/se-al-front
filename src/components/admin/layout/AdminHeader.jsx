import React from "react";
import { Menu, LogOut } from "lucide-react";
import { useAdminRole } from "../hooks/useAdminRole";

/**
 * AdminHeader — barra superior del panel admin.
 *
 * Props:
 *   onToggle  {Function} — callback para colapsar/expandir el sidebar
 *
 * Decisiones de diseño:
 *   - Altura fija 56px para alinearse con el header del sidebar.
 *   - El botón de menú tiene área táctil mínima 44px (accesibilidad mobile).
 *   - El badge de rol usa señal/amber para que sea inmediatamente reconocible
 *     en qué modo administrador está la sesión activa.
 *   - "Cerrar sesión" con icono + texto en desktop; solo icono en espacios estrechos
 *     si se quisiera adaptar (por ahora full label para claridad).
 */
function AdminHeader({ onToggle }) {
  const { rol, logout } = useAdminRole();

  const rolDisplay = rol ? rol.toUpperCase() : null;
  const isGruaman = rol === "gruaman";

  return (
    <header
      style={{
        gridRow: "1",
        gridColumn: "2",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "var(--navy-mid)",
        borderBottom: "1px solid var(--glass-border)",
        gap: 12,
        flexShrink: 0,
        zIndex: 9,
      }}
    >
      {/* ── Izquierda: toggle sidebar ── */}
      <button
        onClick={onToggle}
        aria-label="Alternar menú lateral"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          padding: 0,
          margin: 0,
          marginBottom: 0,
          background: "transparent",
          border: "1px solid transparent",
          borderRadius: "var(--radius-btn, 8px)",
          cursor: "pointer",
          color: "var(--muted)",
          flexShrink: 0,
          transition: "color 0.2s, border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--off-white)";
          e.currentTarget.style.borderColor = "var(--glass-border)";
          e.currentTarget.style.background = "var(--signal-dim)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      {/* ── Centro: título ── */}
      <span
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.5px",
          color: "var(--off-white)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Panel de Administración
      </span>

      {/* ── Derecha: rol + cerrar sesión ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Badge de rol */}
        {rolDisplay && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              fontFamily: "'DM Sans', sans-serif",
              color: isGruaman ? "var(--signal)" : "var(--amber)",
              background: isGruaman ? "var(--signal-dim)" : "var(--amber-dim)",
              border: `1px solid ${
                isGruaman
                  ? "var(--glass-border)"
                  : "rgba(245,166,35,0.25)"
              }`,
              borderRadius: "var(--radius-badge, 4px)",
              padding: "3px 10px",
              lineHeight: "18px",
            }}
          >
            {rolDisplay}
          </span>
        )}

        {/* Botón cerrar sesión */}
        <button
          onClick={logout}
          aria-label="Cerrar sesión"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            marginBottom: 0,
            height: 36,
            fontSize: 12,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            color: "var(--muted)",
            background: "transparent",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-btn, 8px)",
            cursor: "pointer",
            transition: "color 0.2s, border-color 0.2s, box-shadow 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-destructive, #ef4444)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
            e.currentTarget.style.boxShadow = "0 0 12px rgba(239,68,68,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
