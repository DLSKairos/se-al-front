import React from "react";
import * as Dialog from "@radix-ui/react-dialog";

/**
 * ConfirmModal — diálogo de confirmación accesible usando Radix UI Dialog.
 *
 * Props:
 *   open          {boolean}
 *   onOpenChange  {Function}
 *   title         {string}
 *   description   {string}
 *   onConfirm     {Function}
 *   confirmLabel  {string}   — default "Confirmar"
 *   variant       {"default"|"destructive"}
 *
 * Decisiones de diseño:
 *   - Overlay oscuro semitransparente para aislar el modal del contexto.
 *   - El botón de confirmación en rojo cuando variant=destructive para comunicar
 *     que la acción no se puede deshacer.
 *   - Focus trap y accesibilidad gestionados por Radix (role=dialog, aria-modal).
 *   - El contenido usa glass-card para mantener coherencia visual.
 */
function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirmar",
  variant = "default",
}) {
  const isDestructive = variant === "destructive";

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            animation: "fadeIn 0.15s ease",
          }}
        />

        {/* Contenido */}
        <Dialog.Content
          className="glass-card"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1001,
            width: "min(480px, calc(100vw - 32px))",
            padding: "32px",
            outline: "none",
            animation: "slideUp 0.2s ease",
          }}
        >
          {/* Título */}
          <Dialog.Title
            style={{
              margin: "0 0 8px",
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              color: "var(--off-white)",
            }}
          >
            {title}
          </Dialog.Title>

          {/* Descripción */}
          {description && (
            <Dialog.Description
              style={{
                margin: "0 0 28px",
                fontSize: 14,
                color: "var(--muted)",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6,
              }}
            >
              {description}
            </Dialog.Description>
          )}

          {/* Acciones */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            {/* Cancelar */}
            <Dialog.Close asChild>
              <button
                style={{
                  marginBottom: 0,
                  padding: "9px 20px",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  color: "var(--muted)",
                  background: "transparent",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-btn, 8px)",
                  cursor: "pointer",
                  transition: "color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--off-white)";
                  e.currentTarget.style.borderColor = "rgba(240,244,248,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                }}
              >
                Cancelar
              </button>
            </Dialog.Close>

            {/* Confirmar */}
            <button
              onClick={handleConfirm}
              style={{
                marginBottom: 0,
                padding: "9px 20px",
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                color: isDestructive ? "#fff" : "var(--navy)",
                background: isDestructive
                  ? "var(--color-destructive, #ef4444)"
                  : "var(--signal)",
                border: "none",
                borderRadius: "var(--radius-btn, 8px)",
                cursor: "pointer",
                transition: "opacity 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.88";
                e.currentTarget.style.boxShadow = isDestructive
                  ? "0 0 16px rgba(239,68,68,0.45)"
                  : "0 0 16px var(--signal-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translate(-50%, -48%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
      `}</style>
    </Dialog.Root>
  );
}

export default ConfirmModal;
