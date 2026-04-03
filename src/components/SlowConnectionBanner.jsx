/**
 * Banner tipo bottom-sheet que aparece cuando se detecta una conexión lenta.
 *
 * Se desliza hacia arriba con una animación CSS y permite al usuario elegir
 * entre activar el modo lite (sin animaciones, sin juego, acceso directo a los
 * formularios) o descartar la sugerencia.
 *
 * @param {Object} props
 * @param {Function} props.onUseLite - Se llama cuando el usuario selecciona el modo lite.
 * @param {Function} props.onDismiss - Se llama cuando el usuario descarta el banner.
 */
function SlowConnectionBanner({ onUseLite, onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 9000,
      padding: '0 0 env(safe-area-inset-bottom, 0)',
      animation: 'scb-slide-up 0.35s ease both',
    }}>
      <style>{`
        @keyframes scb-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        margin: '0 12px 12px',
        background: '#1a1a2e',
        border: '1px solid rgba(245,166,35,0.35)',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <span style={{
            color: '#FFD700',
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.01em',
          }}>
            Conexión lenta detectada
          </span>
        </div>

        <p style={{
          margin: 0,
          color: 'rgba(255,255,255,0.75)',
          fontSize: '0.84rem',
          lineHeight: 1.5,
        }}>
          La versión lite carga más rápido: sin animaciones, sin video, acceso directo a los formularios.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            Ignorar
          </button>
          <button
            onClick={onUseLite}
            style={{
              background: '#F5A623',
              border: 'none',
              color: '#0C1624',
              borderRadius: 10,
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(245,166,35,0.4)',
            }}
          >
            Usar versión lite →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SlowConnectionBanner;
