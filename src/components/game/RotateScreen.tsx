/**
 * RotateScreen — pantalla de preparación antes de la jornada
 *
 * Props:
 *   duration   number — ms antes de llamar onComplete (default 4000)
 *   onComplete fn     — callback cuando termina el contador
 */
import { useEffect, useState, useRef } from 'react'
import { HardHat } from 'lucide-react'

interface RotateScreenProps {
  duration?:   number
  onComplete?: () => void
}

function RotateScreen({ duration = 4000, onComplete }: RotateScreenProps) {
  const [progress, setProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)
  const calledRef     = useRef(false)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    const start    = Date.now()
    const interval = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / duration) * 100, 100)
      setProgress(pct)
      if (pct >= 100 && !calledRef.current) {
        calledRef.current = true
        clearInterval(interval)
        onCompleteRef.current?.()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [duration])

  return (
    <div className="fixed inset-0 z-[9000] route-bg flex items-center justify-center px-6">
      <div className="liquid rounded-[28px] p-8 flex flex-col items-center gap-5 max-w-xs w-full text-center">
        <span className="w-20 h-20 rounded-[22px] bg-[var(--brand)] text-[var(--on-brand)] grid place-items-center">
          <HardHat className="w-11 h-11" aria-hidden="true" />
        </span>
        <h2 className="text-3xl font-bold font-display text-[var(--fg)] leading-tight">
          Prepárate para tu jornada
        </h2>
        <p className="text-base text-[var(--fg-muted)] font-body">
          Revisa tu equipo de protección antes de empezar.
        </p>
        <div className="w-full h-3 rounded-full bg-[var(--wash-strong)] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="hazard h-full rounded-full transition-[width] duration-75" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

export default RotateScreen
