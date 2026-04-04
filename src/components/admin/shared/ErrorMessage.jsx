import React from "react";
import { AlertCircle } from "lucide-react";

/**
 * ErrorMessage — tarjeta de error con opción de reintento.
 *
 * Props:
 *   message  {string}   — descripción del error para el usuario
 *   onRetry  {Function} — callback opcional; si se omite no se muestra el botón
 *
 * Decisiones de diseño:
 *   - Centrado vertical y horizontal para destacar como estado de la página.
 *   - Icono AlertCircle en destructive comunica severidad sin alarmismo.
 *   - Botón "Reintentar" solo cuando hay acción posible (no mostrar sin sentido).
 *   - Fondo glass mantiene cohesión visual con el resto del panel.
 */
function ErrorMessage({ message, onRetry }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        padding: "24px 16px",
      }}
    >
      <div
        className="glass-card-md"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "32px 40px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Icono de error */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(239,68,68,0.12)",
            color: "var(--color-destructive, #ef4444)",
          }}
        >
          <AlertCircle size={24} strokeWidth={1.75} />
        </div>

        {/* Mensaje */}
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--muted)",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.5,
          }}
        >
          {message || "Ocurrió un error inesperado."}
        </p>

        {/* Botón de reintento */}
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginBottom: 0,
              padding: "8px 20px",
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              color: "var(--signal)",
              background: "var(--signal-dim)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-btn, 8px)",
              cursor: "pointer",
              transition: "box-shadow 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 16px var(--signal-glow)";
              e.currentTarget.style.background = "rgba(0,212,255,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "var(--signal-dim)";
            }}
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
