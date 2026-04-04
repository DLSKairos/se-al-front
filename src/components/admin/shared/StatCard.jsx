import React from "react";

/**
 * StatCard — tarjeta de métrica KPI para el panel admin.
 *
 * Props:
 *   title    {string}          — etiqueta descriptiva de la métrica
 *   value    {string|number}   — valor principal a mostrar
 *   icon     {React.Component} — componente de icono de lucide-react
 *   variant  {"default"|"success"|"warning"|"destructive"} — paleta de color
 *   delta    {string}          — variación opcional, e.g. "+12%" o "-3%"
 *
 * Decisiones de diseño:
 *   - El icono vive en un badge coloreado con baja opacidad para no competir
 *     con el valor numérico, que es lo más importante visualmente.
 *   - stat-glow refuerza la jerarquía visual del dato principal.
 *   - El delta usa verde/rojo semántico para comunicar dirección sin texto adicional.
 */

const VARIANT_STYLES = {
  default:     { icon: "var(--signal)",      bg: "rgba(0,212,255,0.10)"   },
  success:     { icon: "var(--color-success,#22c55e)", bg: "rgba(34,197,94,0.10)"   },
  warning:     { icon: "var(--amber)",       bg: "var(--amber-dim)"       },
  destructive: { icon: "var(--color-destructive,#ef4444)", bg: "rgba(239,68,68,0.10)" },
};

function StatCard({ title, value, icon: Icon, variant = "default", delta }) {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  const isPositiveDelta =
    typeof delta === "string" && delta.startsWith("+");

  return (
    <div
      className="glass-card-md stat-glow flex flex-col gap-3"
      style={{ padding: "20px" }}
    >
      {/* Icono en badge */}
      {Icon && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 10,
            background: styles.bg,
            color: styles.icon,
            flexShrink: 0,
          }}
        >
          <Icon size={20} strokeWidth={1.75} />
        </div>
      )}

      {/* Valor principal */}
      <div
        style={{
          fontFamily: "var(--font-syne, 'Syne', sans-serif)",
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1,
          color: styles.icon,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>

      {/* Fila inferior: título + delta */}
      <div className="flex items-center justify-between gap-2">
        <span
          style={{
            fontSize: 13,
            color: "var(--muted)",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.3,
          }}
        >
          {title}
        </span>

        {delta !== undefined && delta !== null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: isPositiveDelta
                ? "var(--color-success, #22c55e)"
                : "var(--color-destructive, #ef4444)",
              whiteSpace: "nowrap",
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
