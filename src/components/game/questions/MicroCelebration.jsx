/**
 * MicroCelebration — overlay de celebración CSS puro
 *
 * Se muestra DESPUÉS del flip-out, ANTES del flip-in (entre preguntas).
 *
 * Props:
 *   show  bool    — montar/desmontar el overlay
 *   type  string  — 'positive' | 'negative' | 'neutral'
 *   onDone fn     — callback al terminar la animación (~900ms)
 *
 * Tipos:
 *   positive → 11 partículas confetti + ✓ verde
 *   negative → ⚠️ con shake + texto "anota esto"
 *   neutral  → ✓ gris fadeInScale
 *
 * Sin librerías externas — todo CSS puro.
 */
import { useEffect, useRef } from 'react';
import './MicroCelebration.css';

const CONFETTI_COLORS = [
  '#22c55e', '#f59e0b', '#3b82f6',
  '#ec4899', '#a855f7', '#06b6d4',
  '#f97316', '#84cc16', '#e11d48',
  '#0ea5e9', '#d946ef',
];

const PARTICLE_X = [8, 17, 26, 35, 44, 50, 56, 65, 74, 83, 92];

function MicroCelebration({ show, type = 'positive', onDone }) {
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDoneRef.current?.(), 900);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  if (type === 'negative') {
    return (
      <div className="mc-overlay mc-overlay--negative" aria-live="polite">
        <div className="mc-warning-icon" aria-hidden="true">⚠️</div>
        <p className="mc-warning-text">Anota la observación</p>
      </div>
    );
  }

  if (type === 'neutral') {
    return (
      <div className="mc-overlay mc-overlay--neutral" aria-live="polite">
        <div className="mc-check mc-check--neutral" aria-hidden="true">✓</div>
      </div>
    );
  }

  return (
    <div className="mc-overlay mc-overlay--positive" aria-live="polite" aria-label="¡Correcto!">
      {PARTICLE_X.map((xPct, i) => (
        <div
          key={i}
          className="mc-particle"
          style={{
            left:            `${xPct}%`,
            top:             `${8 + (i * 13) % 28}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay:  `${(i * 0.04).toFixed(2)}s`,
            width:           i % 3 === 0 ? '11px' : '8px',
            height:          i % 3 === 0 ? '11px' : '15px',
            borderRadius:    i % 2 === 0 ? '50%' : '2px',
            transform:       `rotate(${i * 33}deg)`,
          }}
        />
      ))}
      <div className="mc-check mc-check--positive" aria-hidden="true">✓</div>
    </div>
  );
}

export default MicroCelebration;
