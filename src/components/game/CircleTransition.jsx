import { useEffect, useState, useRef } from 'react';
import './CircleTransition.css';

/**
 * CircleTransition — iris wipe estilo videojuego
 *
 * Props:
 *   direction  'in' | 'out'  — 'out' cubre la pantalla (negro expande)
 *                               'in'  revela la pantalla (negro se contrae)
 *   color      string        — color del círculo (default '#0a0a0a')
 *   duration   number        — ms de la animación (default 550)
 *   onDone     fn            — callback al terminar la animación
 *
 * Uso típico:
 *   // 1. Cubrir antes de navegar:
 *   <CircleTransition direction="out" onDone={() => navigate('/siguiente')} />
 *
 *   // 2. Revelar al montar la nueva pantalla:
 *   <CircleTransition direction="in" />
 */
function CircleTransition({ direction = 'in', color = '#0a0a0a', duration = 550, onDone }) {
  const [active, setActive] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setActive(true), 20);
    const t2 = setTimeout(() => onDoneRef.current?.(), duration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duration]);

  return (
    <div
      className={`ct-overlay ct-${direction} ${active ? 'ct-active' : ''}`}
      style={{
        '--ct-color': color,
        '--ct-dur': `${duration}ms`,
      }}
    />
  );
}

export default CircleTransition;
