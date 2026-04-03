import { useState, useEffect, useRef } from 'react';
import './OrientationLock.css';

/**
 * Detecta si el dispositivo está en landscape usando
 * la Screen Orientation API (más fiable que solo dimensiones).
 */
function checkLandscape() {
  // Screen Orientation API — soportada en Chrome/Android, algunos Safari
  if (screen.orientation?.type) {
    return screen.orientation.type.startsWith('landscape');
  }
  // Fallback por dimensiones
  return window.innerWidth > window.innerHeight;
}

/**
 * OrientationLock — modo estricto
 *
 * • Intenta bloquear el dispositivo en landscape via screen.orientation.lock()
 * • Si el SO no lo permite (iOS, algunos Android), muestra overlay de bloqueo
 * • El overlay es NO-dismissible: el usuario DEBE rotar el dispositivo
 * • Solo renderiza `children` cuando el dispositivo está en landscape
 *
 * Props:
 *   children  ReactNode  — contenido a proteger
 */
function OrientationLock({ children }) {
  const [landscape, setLandscape] = useState(checkLandscape);
  const lockAttempted = useRef(false);

  useEffect(() => {
    if (lockAttempted.current) return;
    lockAttempted.current = true;

    if (screen.orientation?.lock) {
      screen.orientation.lock('landscape').catch(() => {
        // No soportado o denegado por el SO — el overlay manual lo gestiona
      });
    }
  }, []);

  useEffect(() => {
    const update = () => setLandscape(checkLandscape());

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    if (screen.orientation) {
      screen.orientation.addEventListener('change', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', update);
      }
    };
  }, []);

  if (!landscape) {
    return (
      <div className="ol-block" role="alert" aria-live="polite">

        <div className="ol-bg-dots" />

        <div className="ol-phone-wrap">
          <div className="ol-phone-portrait">
            <PhoneSVG />
          </div>
          <div className="ol-arrow-wrap">
            <svg className="ol-curved-arrow" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 10 50 Q 50 -10 90 50"
                stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                fill="none" strokeDasharray="8 4"
              />
              <polygon points="90,42 90,58 80,50" fill="currentColor" />
            </svg>
          </div>
          <div className="ol-phone-landscape">
            <PhoneSVG landscape />
          </div>
        </div>

        <div className="ol-text">
          <h2 className="ol-title">Modo horizontal requerido</h2>
          <p className="ol-subtitle">
            Gira tu dispositivo para continuar la misión, héroe
          </p>
        </div>

        <div className="ol-pulse-bar">
          <span /><span /><span /><span /><span />
        </div>

        <div className="ol-accent-line" />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Silueta SVG genérica de teléfono utilizada en orientaciones vertical y horizontal.
 * @param {{ landscape?: boolean }} props
 */
function PhoneSVG({ landscape = false }) {
  return (
    <svg
      className={`ol-phone-svg ${landscape ? 'ol-phone-svg--land' : ''}`}
      viewBox="0 0 60 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="54" height="94" rx="9" stroke="currentColor" strokeWidth="3.5" fill="rgba(255,255,255,0.04)" />
      <circle cx="30" cy="88" r="4" fill="currentColor" opacity="0.5" />
      <rect x="18" y="9" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.35" />
      {/* Área de pantalla */}
      <rect x="9" y="18" width="42" height="62" rx="3" fill="rgba(255,255,255,0.06)" />
    </svg>
  );
}

export default OrientationLock;
