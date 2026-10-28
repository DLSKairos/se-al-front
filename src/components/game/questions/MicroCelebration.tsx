/**
 * MicroCelebration — confirmación breve tras cada respuesta
 *
 * Props:
 *   show    boolean — montar/desmontar el overlay
 *   type    'positive' | 'negative' | 'neutral'
 *   onDone  fn      — callback al terminar (~900ms)
 */
import { useEffect, useRef } from 'react'
import { Check, TriangleAlert } from 'lucide-react'

interface MicroCelebrationProps {
  show?: boolean
  type?: 'positive' | 'negative' | 'neutral'
  onDone?: () => void
}

const CONFETTI = ['var(--brand)', 'var(--ok)', 'var(--fg)', 'var(--info)', 'var(--warn)']
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

  const sign =
    type === 'negative'
      ? { cls: 'bg-[var(--warn)] text-[var(--on-warn)] rounded-[22%]', icon: <TriangleAlert className="w-14 h-14" aria-hidden="true" />, label: 'Anota la observación' }
      : type === 'neutral'
      ? { cls: 'bg-[var(--surface)] text-[var(--fg)] rounded-full', icon: <Check className="w-14 h-14" strokeWidth={3.5} aria-hidden="true" />, label: 'Registrado' }
      : { cls: 'bg-[var(--ok)] text-[var(--on-ok)] rounded-[22%]', icon: <Check className="w-14 h-14" strokeWidth={4} aria-hidden="true" />, label: '¡Correcto!' }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 pointer-events-none bg-[color-mix(in_srgb,var(--bg)_70%,transparent)]" aria-live="polite">
      {type === 'positive' &&
        PARTICLE_X.map((xPct, i) => (
          <span
            key={i}
            className="absolute game-confetti"
            style={{
              left: `${xPct}%`,
              top: `${12 + (i * 13) % 30}%`,
              backgroundColor: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i * 0.04).toFixed(2)}s`,
              width: i % 3 === 0 ? 12 : 9,
              height: i % 3 === 0 ? 12 : 16,
              borderRadius: 3,
              transform: `rotate(${i * 33}deg)`,
            }}
          />
        ))}
      <span className={`w-28 h-28 border-[4px] border-[var(--fg)] grid place-items-center game-fade-scale ${sign.cls}`}>{sign.icon}</span>
      <p className="font-display font-extrabold text-3xl text-[var(--fg)] game-fade-scale">{sign.label}</p>
    </div>
  )
}

export default MicroCelebration
