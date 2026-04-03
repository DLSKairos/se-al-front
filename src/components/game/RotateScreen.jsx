import { useEffect, useState, useRef } from 'react';
import './RotateScreen.css';

/**
 * RotateScreen — pantalla de transición que pide modo horizontal
 *
 * Props:
 *   duration   number  — ms antes de llamar onComplete (default 4000)
 *   onComplete fn      — callback cuando termina el contador
 */
function RotateScreen({ duration = 4000, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [landscape, setLandscape] = useState(window.innerWidth > window.innerHeight);
  const onCompleteRef = useRef(onComplete);
  const calledRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => {
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct >= 100 && !calledRef.current) {
        calledRef.current = true;
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const remainingSec = Math.max(0, Math.ceil(((100 - progress) / 100) * (duration / 1000)));

  return (
    <div className="rs-overlay">
      <div className="rs-content">

        {/* Texto */}
        <h2 className="rs-title">
          {landscape ? '¡Modo héroe activado!' : '¿Estás listo súper héroe?'}
        </h2>
        <p className="rs-subtitle">
          {landscape
            ? 'Preparando la misión...'
            : 'Estás a punto de empezar una nueva aventura'}
        </p>

        <div className="rs-bar">
          <div className="rs-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {remainingSec > 0 && (
          <p className="rs-countdown">{remainingSec}s</p>
        )}

        <div className="rs-dots">
          <span /><span /><span />
        </div>

      </div>
    </div>
  );
}

export default RotateScreen;
