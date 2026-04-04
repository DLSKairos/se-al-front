import React from "react";

/**
 * StatusBadge — pill de estado semántico.
 *
 * Props:
 *   status {"aprobado"|"pendiente"|"rechazado"|"activo"|"inactivo"}
 *
 * Decisiones de diseño:
 *   - Uppercase + tamaño 11px: comunica "etiqueta de sistema" sin competir
 *     con el contenido principal de la fila.
 *   - Cada color es semántico: verde=ok, amber=espera, rojo=problema,
 *     signal=vivo, muted=inactivo.
 *   - Sin icono para mantener densidad en tablas.
 */

const STATUS_MAP = {
  aprobado:  { label: "Aprobado",  color: "var(--color-success, #22c55e)",         bg: "rgba(34,197,94,0.12)"    },
  pendiente: { label: "Pendiente", color: "var(--amber)",                           bg: "var(--amber-dim)"        },
  rechazado: { label: "Rechazado", color: "var(--color-destructive, #ef4444)",      bg: "rgba(239,68,68,0.12)"   },
  activo:    { label: "Activo",    color: "var(--signal)",                          bg: "var(--signal-dim)"      },
  inactivo:  { label: "Inactivo",  color: "var(--muted)",                           bg: "rgba(240,244,248,0.06)" },
};

function StatusBadge({ status }) {
  const config = STATUS_MAP[status?.toLowerCase()] ?? STATUS_MAP.inactivo;

  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}33`,
        borderRadius: "var(--radius-badge, 4px)",
        padding: "2px 8px",
        lineHeight: "18px",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
