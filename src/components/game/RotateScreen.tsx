/**
 * RotateScreen — pantalla de transición que pide modo horizontal
 *
 * Props:
 *   duration   number — ms antes de llamar onComplete (default 4000)
 *   onComplete fn     — callback cuando termina el contador
 */
import { useEffect, useState, useRef } from 'react'

const PULSE_DELAYS_3 = ['[animation-delay:0s]', '[animation-delay:0.2s]', '[animation-delay:0.4s]'] as const

interface RotateScreenProps {
  duration?:   number
  onComplete?: () => void
}

function RotateScreen({ duration = 4000, onComplete }: RotateScreenProps) {
  const [progress,  setProgress]  = useState(0)
  const [landscape, setLandscape] = useState(window.innerWidth > window.innerHeight)
  const onCompleteRef = useRef(onComplete)
  const calledRef     = useRef(false)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  useEffect(() => {
    const start    = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct     = Math.min((elapsed / duration) * 100, 100)
      setProgress(pct)

      if (pct >= 100 && !calledRef.current) {
        calledRef.current = true
        clearInterval(interval)
        onCompleteRef.current?.()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration])

  const remainingSec = Math.max(0, Math.ceil(((100 - progress) / 100) * (duration / 1000)))

  return (
    <div className="fixed inset-0 z-[9000] bg-[var(--navy)] flex items-center justify-center">
      <div className="glass p-8 rounded-[24px] flex flex-col items-center gap-5 px-8 max-w-xs w-full text-center">
        {/* Logo signal dot */}
        <div className="w-3 h-3 bg-[var(--signal)] rounded-full animate-pulse-dot mb-4" />

        <h2 className="text-2xl font-bold font-['Syne'] text-[var(--off-white)]">
          {landscape ? '¡Modo héroe activado!' : '¿Estás listo súper héroe?'}
        </h2>
        <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
          {landscape
            ? 'Preparando la misión...'
            : 'Estás a punto de empezar una nueva aventura'}
        </p>

        <div className="w-full h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{
              background: 'linear-gradient(90deg, #00D4FF, #0096b3)',
              width: `${progress}%`,
            }}
          />
        </div>

        {remainingSec > 0 && (
          <p className="text-[var(--signal)] font-bold font-['Syne'] text-lg tabular-nums">
            {remainingSec}s
          </p>
        )}

        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse ${PULSE_DELAYS_3[i]}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RotateScreen
