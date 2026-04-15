/**
 * MicroCelebration — overlay de celebración Tailwind puro
 *
 * Props:
 *   show    boolean — montar/desmontar el overlay
 *   type    'positive' | 'negative' | 'neutral'
 *   onDone  fn      — callback al terminar la animación (~900ms)
 *
 * Sin archivos CSS externos.
 */
import { useEffect, useRef } from 'react'

interface MicroCelebrationProps {
  show?: boolean
  type?: 'positive' | 'negative' | 'neutral'
  onDone?: () => void
}

const CONFETTI_COLORS = [
  '#22c55e', '#f59e0b', '#3b82f6',
  '#ec4899', '#a855f7', '#06b6d4',
  '#f97316', '#84cc16', '#e11d48',
  '#0ea5e9', '#d946ef',
]

const PARTICLE_X = [8, 17, 26, 35, 44, 50, 56, 65, 74, 83, 92]

function MicroCelebration({ show, type = 'positive', onDone }: MicroCelebrationProps) {
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => onDoneRef.current?.(), 900)
    return () => clearTimeout(t)
  }, [show])

  if (!show) return null

  if (type === 'negative') {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-red-500/8 pointer-events-none"
        aria-live="polite"
      >
        <div className="text-6xl game-shake" aria-hidden="true">⚠️</div>
        <p className="mt-2 text-base font-semibold text-red-400 font-['DM_Sans'] game-fade-scale">
          Anota la observación
        </p>
      </div>
    )
  }

  if (type === 'neutral') {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/4 pointer-events-none"
        aria-live="polite"
      >
        <div className="text-7xl font-bold text-slate-400 leading-none game-fade-scale" aria-hidden="true">
          ✓
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-green-500/8 pointer-events-none"
      aria-live="polite"
      aria-label="¡Correcto!"
    >
      {/* Radial burst */}
      <div
        className="absolute w-48 h-48 rounded-full transition-all duration-500"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)' }}
      />

      {PARTICLE_X.map((xPct, i) => (
        <div
          key={i}
          className="absolute game-confetti"
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

      {/* Checkmark circle */}
      <div
        className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.15)] border-2 border-green-500 grid place-items-center game-fade-scale"
        style={{ boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}
        aria-hidden="true"
      >
        <span className="font-display font-extrabold text-2xl text-[var(--signal)]">✓</span>
      </div>
    </div>
  )
}

export default MicroCelebration
