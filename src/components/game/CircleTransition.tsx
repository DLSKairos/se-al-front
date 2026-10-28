/**
 * CircleTransition — iris wipe estilo videojuego
 *
 * Props:
 *   direction  'in' | 'out'  — 'out' cubre, 'in' revela
 *   color      string        — color del círculo (default: amarillo de marca)
 *   duration   number        — ms de la animación (default 550)
 *   onDone     fn            — callback al terminar la animación
 */
import { useEffect, useState, useRef } from 'react'

interface CircleTransitionProps {
  direction?: 'in' | 'out'
  color?:     string
  duration?:  number
  onDone?:    () => void
}

function CircleTransition({
  direction = 'in',
  color     = 'var(--brand)',
  duration  = 550,
  onDone,
}: CircleTransitionProps) {
  const [active, setActive] = useState(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t1 = setTimeout(() => setActive(true), 20)
    const t2 = setTimeout(() => onDoneRef.current?.(), reduce ? 0 : duration)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [duration])

  const clipStyle: React.CSSProperties = {
    backgroundColor: color,
    transition:      `clip-path ${duration}ms cubic-bezier(0.7,0,0.3,1)`,
    clipPath:
      direction === 'out'
        ? active ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)'
        : active ? 'circle(0% at 50% 50%)'   : 'circle(150% at 50% 50%)',
  }

  return <div className="fixed inset-0 z-[9500] pointer-events-none" style={clipStyle} aria-hidden="true" />
}

export default CircleTransition
