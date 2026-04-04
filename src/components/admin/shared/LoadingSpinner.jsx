import React from "react";

/**
 * LoadingSpinner — indicador de carga centrado.
 *
 * Props:
 *   height {string} — altura del contenedor flex (default "200px")
 *
 * Decisiones de diseño:
 *   - El spinner usa el color signal para mantener coherencia con el sistema.
 *   - La altura configurable permite usarlo tanto en páginas completas
 *     como dentro de tarjetas pequeñas.
 *   - Sin texto adicional: el contexto ya da suficiente información al usuario.
 */
function LoadingSpinner({ height = "200px" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: height,
        width: "100%",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "3px solid var(--glass-border)",
          borderTopColor: "var(--signal)",
          animation: "spin 0.75s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;
