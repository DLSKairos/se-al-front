/**
 * TimerChallenge — countdown circular SVG
 *
 * Props:
 *   duration  number — segundos totales
 *   onExpire  fn     — callback cuando llega a 0
 */
import { useState, useEffect, useRef } from 'react'

interface TimerChallengeProps {
  duration: number
  onExpire?: () => void
}

const RADIUS        = 38
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getColor(remaining: number, total: number): string {
  const pct = remaining / total
  if (pct > 0.5) return '#22c55e'
  if (pct > 0.2) return '#f59e0b'
  return '#ef4444'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function TimerChallenge({ duration, onExpire }: TimerChallengeProps) {
  const [remaining, setRemaining] = useState(duration)
  const [expired,   setExpired]   = useState(false)

  const onExpireRef = useRef(onExpire)
  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  useEffect(() => {
    if (remaining <= 0) {
      setExpired(true)
      onExpireRef.current?.()
      return
    }

    const t = setTimeout(() => setRemaining((prev) => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const progress         = expired ? 0 : remaining / duration
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)
  const color            = expired ? '#94a3b8' : getColor(remaining, duration)
  const isUrgent         = !expired && remaining / duration <= 0.2

  return (
    <div
      className={[
        'relative flex items-center justify-center w-[90px] h-[90px]',
        isUrgent ? 'animate-pulse' : '',
      ].join(' ')}
      role="timer"
      aria-label={expired ? 'Tiempo agotado' : `${formatTime(remaining)} restantes`}
      aria-live="off"
    >
      <svg className="absolute inset-0" viewBox="0 0 90 90" aria-hidden="true">
        <circle
          cx="45" cy="45" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="6"
        />
        <circle
          cx="45" cy="45" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 45 45)"
          className="stroke-timer-transition"
        />
      </svg>

      <div className="relative z-10 flex items-center justify-center" style={{ color }}>
        {expired ? (
          <span className="text-2xl font-bold" aria-hidden="true">✓</span>
        ) : (
          <span className="text-xs font-bold font-['Syne'] tabular-nums">
            {formatTime(remaining)}
          </span>
        )}
      </div>
    </div>
  )
}

export default TimerChallenge
